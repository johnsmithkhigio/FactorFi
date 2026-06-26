// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IInvoiceReceiptNFT {
    function mint(address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IRevenueDistributor {
    event RevenueSplitUpdated(
        uint256 treasuryShareBps,
        uint256 underwriterShareBps,
        uint256 reservePoolShareBps
    );
    event RevenueDistributed(
        uint256 indexed invoiceId,
        uint256 totalFeeAmount,
        uint256 treasuryPayout,
        uint256 underwriterPayout,
        uint256 reservePayout
    );

    function setRevenueSplit(
        uint256 _treasuryShareBps,
        uint256 _underwriterShareBps,
        uint256 _reservePoolShareBps
    ) external;

    function setRevenueAddresses(
        address _treasuryAddress,
        address _underwriterAddress,
        address _reserveAddress
    ) external;
}

/**
 * @title FactorFi — Reverse Factoring Protocol on Arc
 * @notice On-chain invoice factoring with multi-role lifecycle:
 *         Anchor → Supplier → Investor → Settlement
 * @dev Uses USDC (6 decimals) on Arc Testnet
 */
contract FactorFi is IRevenueDistributor {
    mapping(address => bool) public supportedTokens;
    address public owner;

    // --- Roles ---
    struct Anchor {
        string name;
        uint256 creditRating; // 0-1000
        uint256 totalApproved;
        uint256 totalSettled;
        bool isRegistered;
    }

    // --- Invoice ---
    enum InvoiceStatus { Submitted, Approved, Funded, Settled, Defaulted }

    struct Invoice {
        uint256 id;
        address supplier;
        address anchor;
        address investor;
        address token;         // Dynamic stablecoin address (USDC/EURC)
        uint256 amount;        // Face value in tokens
        uint256 fundedAmount;  // Discounted amount investor paid
        uint256 discountBps;   // Discount in basis points (e.g. 300 = 3%)
        uint256 dueDate;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 settledAt;
        string description;
        InvoiceStatus status;
    }

    // --- Storage ---
    mapping(address => Anchor) public anchors;
    mapping(uint256 => Invoice) public invoices;
    uint256 public nextInvoiceId;
    uint256 public totalFactoredVolume;
    uint256 public totalSettledVolume;
    uint256 public protocolFeeBps; // e.g. 50 = 0.5%

    // --- Underwrite & Double-Factoring Protection ---
    mapping(bytes32 => bool) public invoiceHashes;
    address public underwriterAgent;

    // --- Secondary Market Tokenization ---
    address public receiptNFT;
    mapping(uint256 => bool) public isTokenized;

    // --- Circle Compliance Integration ---
    mapping(address => bool) public isCompliant;
    address public complianceSigner;

    modifier onlyCompliant() {
        require(isCompliant[msg.sender], "Address is not compliant");
        _;
    }

    // --- Revenue Splitting Engine Storage ---
    address public treasuryAddress;
    address public underwriterAddress;
    address public reserveAddress;
    
    uint256 public treasuryShareBps;      // basis points (e.g. 5000 = 50.00%)
    uint256 public underwriterShareBps;   // basis points (e.g. 3000 = 30.00%)
    uint256 public reservePoolShareBps;   // basis points (e.g. 2000 = 20.00%)

    // --- Credit Passport ---
    struct CreditProfile {
        uint256 invoicesSettled;
        uint256 invoicesDefaulted;
        uint256 totalVolume;
        uint256 avgSettlementTime; // in seconds
        uint256 onTimeRateBps;     // basis points (9500 = 95%)
        uint256 totalAmountFactored;
        uint256 totalAmountSettled;
        uint256 weightedAvgSettlementDays;
        uint256 highestSingleInvoiceValue;
    }
    mapping(address => CreditProfile) public creditProfiles;

    // --- Events ---
    event AnchorRegistered(address indexed anchor, string name, uint256 creditRating);
    event InvoiceSubmitted(uint256 indexed invoiceId, address indexed supplier, address indexed anchor, uint256 amount, uint256 dueDate, string description);
    event InvoiceApproved(uint256 indexed invoiceId, address indexed anchor);
    event InvoiceFunded(uint256 indexed invoiceId, address indexed investor, uint256 fundedAmount, uint256 discountBps);
    event InvoiceSettled(uint256 indexed invoiceId, address indexed anchor, uint256 investorPayout, uint256 protocolFee);
    event CreditProfileUpdated(address indexed entity, uint256 invoicesSettled, uint256 onTimeRateBps);
    event UnderwriterAgentUpdated(address indexed newAgent);
    event SupportedTokenUpdated(address indexed token, bool supported);
    event ComplianceStatusUpdated(address indexed user, bool status);
    event ComplianceSignerUpdated(address indexed newSigner);

    constructor(address[] memory _tokens, uint256 _protocolFeeBps) {
        owner = msg.sender;
        underwriterAgent = msg.sender; // default underwriter
        protocolFeeBps = _protocolFeeBps;

        // Initialize compliance
        isCompliant[msg.sender] = true;
        complianceSigner = msg.sender;

        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != address(0), "Invalid token");
            supportedTokens[_tokens[i]] = true;
        }

        // Initialize revenue splitting configurations to 50% / 30% / 20%
        treasuryAddress = msg.sender;
        underwriterAddress = msg.sender;
        reserveAddress = msg.sender;

        treasuryShareBps = 5000;
        underwriterShareBps = 3000;
        reservePoolShareBps = 2000;
    }

    // ========== ANCHOR FUNCTIONS ==========

    function registerAnchor(string calldata _name, uint256 _creditRating) external onlyCompliant {
        require(!anchors[msg.sender].isRegistered, "Already registered");
        require(_creditRating <= 1000, "Rating 0-1000");

        anchors[msg.sender] = Anchor({
            name: _name,
            creditRating: _creditRating,
            totalApproved: 0,
            totalSettled: 0,
            isRegistered: true
        });

        emit AnchorRegistered(msg.sender, _name, _creditRating);
    }

    function approveInvoice(uint256 _invoiceId) external {
        Invoice storage inv = invoices[_invoiceId];
        require(inv.anchor == msg.sender, "Not your invoice");
        require(inv.status == InvoiceStatus.Submitted, "Not submitted");

        inv.status = InvoiceStatus.Approved;
        anchors[msg.sender].totalApproved += inv.amount;

        emit InvoiceApproved(_invoiceId, msg.sender);
    }

    function settleInvoice(uint256 _invoiceId) external {
        Invoice storage inv = invoices[_invoiceId];
        require(inv.anchor == msg.sender, "Not your invoice");
        require(inv.status == InvoiceStatus.Funded, "Not funded");

        // Anchor pays face value
        uint256 faceValue = inv.amount;
        uint256 totalFeeAmount = (faceValue * protocolFeeBps) / 10000;
        uint256 investorPayout = faceValue - totalFeeAmount;

        // Transfer from anchor: face value
        require(IERC20(inv.token).transferFrom(msg.sender, address(this), faceValue), "Anchor payment failed");

        // Pay investor: face value minus protocol fee
        if (investorPayout > 0) {
            address currentInvestor = inv.investor;
            if (isTokenized[_invoiceId]) {
                currentInvestor = IInvoiceReceiptNFT(receiptNFT).ownerOf(_invoiceId);
            }
            require(IERC20(inv.token).transfer(currentInvestor, investorPayout), "Investor payout failed");
        }

        // Split and distribute the protocol fee instantly
        if (totalFeeAmount > 0) {
            uint256 treasuryPayout = (totalFeeAmount * treasuryShareBps) / 10000;
            uint256 underwriterPayout = (totalFeeAmount * underwriterShareBps) / 10000;
            uint256 reservePayout = totalFeeAmount - treasuryPayout - underwriterPayout; // round down dust to reserve pool

            if (treasuryPayout > 0) {
                require(IERC20(inv.token).transfer(treasuryAddress, treasuryPayout), "Treasury fee payout failed");
            }
            if (underwriterPayout > 0) {
                require(IERC20(inv.token).transfer(underwriterAddress, underwriterPayout), "Underwriter fee payout failed");
            }
            if (reservePayout > 0) {
                require(IERC20(inv.token).transfer(reserveAddress, reservePayout), "Reserve fee payout failed");
            }

            emit RevenueDistributed(_invoiceId, totalFeeAmount, treasuryPayout, underwriterPayout, reservePayout);
        }

        inv.status = InvoiceStatus.Settled;
        inv.settledAt = block.timestamp;
        anchors[msg.sender].totalSettled += faceValue;
        totalSettledVolume += faceValue;

        // Update credit profiles
        _updateCreditProfile(msg.sender, true, inv.settledAt - inv.fundedAt, faceValue);
        _updateCreditProfile(inv.supplier, true, inv.settledAt - inv.createdAt, faceValue);

        emit InvoiceSettled(_invoiceId, msg.sender, investorPayout, totalFeeAmount);
    }

    // ========== SUPPLIER FUNCTIONS ==========

    function submitInvoice(
        address _anchor,
        uint256 _amount,
        uint256 _dueDate,
        string calldata _description,
        bytes32 _invoiceHash,
        bytes calldata _signature,
        address _token
    ) external onlyCompliant returns (uint256) {
        return submitInvoiceOnBehalf(msg.sender, _anchor, _amount, _dueDate, _description, _invoiceHash, _signature, _token);
    }

    function submitInvoiceOnBehalf(
        address _supplier,
        address _anchor,
        uint256 _amount,
        uint256 _dueDate,
        string calldata _description,
        bytes32 _invoiceHash,
        bytes calldata _signature,
        address _token
    ) public onlyCompliant returns (uint256) {
        require(isCompliant[_supplier], "Supplier is not compliant");
        if (msg.sender != _supplier) {
            require(msg.sender == owner, "Only owner can submit on behalf of supplier");
        }
        require(supportedTokens[_token], "Token not supported");
        require(anchors[_anchor].isRegistered, "Anchor not registered");
        require(_amount > 0, "Amount must be > 0");
        require(_dueDate > block.timestamp, "Due date must be future");
        
        // 1. Double-Factoring Protection check
        require(!invoiceHashes[_invoiceHash], "Invoice already factored on-chain");
        invoiceHashes[_invoiceHash] = true;

        // 2. Underwriter Agent signature verification
        if (underwriterAgent != address(0)) {
            bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _invoiceHash));
            address signer = recoverSigner(ethSignedMessageHash, _signature);
            require(signer == underwriterAgent, "Invalid AI Underwriter signature verification");
        }

        uint256 id = nextInvoiceId++;
        invoices[id] = Invoice({
            id: id,
            supplier: _supplier,
            anchor: _anchor,
            investor: address(0),
            token: _token,
            amount: _amount,
            fundedAmount: 0,
            discountBps: 0,
            dueDate: _dueDate,
            createdAt: block.timestamp,
            fundedAt: 0,
            settledAt: 0,
            description: _description,
            status: InvoiceStatus.Submitted
        });

        emit InvoiceSubmitted(id, _supplier, _anchor, _amount, _dueDate, _description);
        return id;
    }

    // ========== INVESTOR FUNCTIONS ==========

    function fundInvoice(uint256 _invoiceId, uint256 _discountBps) external onlyCompliant {
        Invoice storage inv = invoices[_invoiceId];
        require(inv.status == InvoiceStatus.Approved, "Not approved");
        require(_discountBps > 0 && _discountBps < 5000, "Discount 1-4999 bps");

        uint256 discountedAmount = inv.amount - (inv.amount * _discountBps / 10000);

        // Investor pays discounted amount
        require(IERC20(inv.token).transferFrom(msg.sender, address(this), discountedAmount), "Funding failed");

        // Supplier gets immediate payment (discounted)
        require(IERC20(inv.token).transfer(inv.supplier, discountedAmount), "Supplier payout failed");

        inv.investor = msg.sender;
        inv.fundedAmount = discountedAmount;
        inv.discountBps = _discountBps;
        inv.status = InvoiceStatus.Funded;
        inv.fundedAt = block.timestamp;
        totalFactoredVolume += inv.amount;

        emit InvoiceFunded(_invoiceId, msg.sender, discountedAmount, _discountBps);
    }

    // ========== VIEWS ==========

    function getInvoice(uint256 _invoiceId) external view returns (Invoice memory) {
        return invoices[_invoiceId];
    }

    function getCreditProfile(address _entity) external view returns (CreditProfile memory) {
        return creditProfiles[_entity];
    }

    function getAnchor(address _addr) external view returns (Anchor memory) {
        return anchors[_addr];
    }

    function getProtocolStats() external view returns (
        uint256 _totalFactored,
        uint256 _totalSettled,
        uint256 _totalInvoices,
        uint256 _protocolFeeBps
    ) {
        return (totalFactoredVolume, totalSettledVolume, nextInvoiceId, protocolFeeBps);
    }

    // ========== INTERNAL ==========

    function _updateCreditProfile(address _entity, bool _onTime, uint256 _settlementTime, uint256 _amount) internal {
        CreditProfile storage profile = creditProfiles[_entity];

        if (_onTime) {
            profile.invoicesSettled++;
        } else {
            profile.invoicesDefaulted++;
        }

        uint256 previousAmountSettled = profile.totalAmountSettled;
        profile.totalAmountFactored += _amount;
        profile.totalVolume += 1;
        
        if (_onTime) {
            profile.totalAmountSettled += _amount;
        }

        if (_amount > profile.highestSingleInvoiceValue) {
            profile.highestSingleInvoiceValue = _amount;
        }

        // Rolling Weighted Average Calculation:
        if (_onTime && profile.totalAmountSettled > 0) {
            uint256 settlementDays = _settlementTime / 86400;
            if (settlementDays == 0 && _settlementTime > 0) {
                settlementDays = 1;
            }
            if (previousAmountSettled == 0) {
                profile.weightedAvgSettlementDays = settlementDays;
            } else {
                profile.weightedAvgSettlementDays = ((profile.weightedAvgSettlementDays * previousAmountSettled) + (settlementDays * _amount)) / profile.totalAmountSettled;
            }
        }

        uint256 total = profile.invoicesSettled + profile.invoicesDefaulted;
        profile.onTimeRateBps = total > 0 ? (profile.invoicesSettled * 10000) / total : 0;
        profile.avgSettlementTime = (profile.avgSettlementTime + _settlementTime) / 2;

        emit CreditProfileUpdated(_entity, profile.invoicesSettled, profile.onTimeRateBps);
    }

    // ========== SIGNATURE RECOVERY HELPERS ==========

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _sig) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_sig);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // ========== OWNER & REVENUE SPLITTING ROLES ==========

    function setRevenueSplit(
        uint256 _treasuryShareBps,
        uint256 _underwriterShareBps,
        uint256 _reservePoolShareBps
    ) external override {
        require(msg.sender == owner, "Not owner");
        require(_treasuryShareBps + _underwriterShareBps + _reservePoolShareBps == 10000, "Share splits sum must equal 10000 BPS (100.00%)");
        
        treasuryShareBps = _treasuryShareBps;
        underwriterShareBps = _underwriterShareBps;
        reservePoolShareBps = _reservePoolShareBps;
        
        emit RevenueSplitUpdated(_treasuryShareBps, _underwriterShareBps, _reservePoolShareBps);
    }

    function setRevenueAddresses(
        address _treasuryAddress,
        address _underwriterAddress,
        address _reserveAddress
    ) external override {
        require(msg.sender == owner, "Not owner");
        require(_treasuryAddress != address(0) && _underwriterAddress != address(0) && _reserveAddress != address(0), "Invalid address");
        
        treasuryAddress = _treasuryAddress;
        underwriterAddress = _underwriterAddress;
        reserveAddress = _reserveAddress;
    }

    function setUnderwriterAgent(address _agent) external {
        require(msg.sender == owner, "Not owner");
        underwriterAgent = _agent;
        emit UnderwriterAgentUpdated(_agent);
    }

    function withdrawFees(address _token, address _to) external {
        require(msg.sender == owner, "Not owner");
        require(supportedTokens[_token], "Token not supported");
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance > 0) {
            require(IERC20(_token).transfer(_to, balance), "Withdraw failed");
        }
    }

    function setSupportedToken(address _token, bool _supported) external {
        require(msg.sender == owner, "Not owner");
        require(_token != address(0), "Invalid token");
        supportedTokens[_token] = _supported;
        emit SupportedTokenUpdated(_token, _supported);
    }

    function setProtocolFee(uint256 _feeBps) external {
        require(msg.sender == owner, "Not owner");
        require(_feeBps <= 500, "Max 5%");
        protocolFeeBps = _feeBps;
    }

    event InvoiceTokenized(uint256 indexed invoiceId, address indexed investor);

    function setReceiptNFT(address _receiptNFT) external {
        require(msg.sender == owner, "Not owner");
        require(_receiptNFT != address(0), "Invalid NFT address");
        receiptNFT = _receiptNFT;
    }

    function tokenizeInvoice(uint256 _invoiceId) external {
        Invoice storage inv = invoices[_invoiceId];
        require(inv.status == InvoiceStatus.Funded, "Invoice must be in Funded status");
        require(inv.investor == msg.sender, "Only the investor can tokenize");
        require(!isTokenized[_invoiceId], "Invoice already tokenized");

        isTokenized[_invoiceId] = true;
        IInvoiceReceiptNFT(receiptNFT).mint(msg.sender, _invoiceId);

        emit InvoiceTokenized(_invoiceId, msg.sender);
    }

    // --- Circle Compliance Integration Functions ---
    function updateComplianceStatus(address _user, bool _status) external {
        require(msg.sender == owner, "Not owner");
        isCompliant[_user] = _status;
        emit ComplianceStatusUpdated(_user, _status);
    }

    function registerAnchorOnBehalf(address _anchor, string calldata _name, uint256 _creditRating) external {
        require(msg.sender == owner, "Not owner");
        require(!anchors[_anchor].isRegistered, "Already registered");
        require(_creditRating <= 1000, "Rating 0-1000");

        anchors[_anchor] = Anchor({
            name: _name,
            creditRating: _creditRating,
            totalApproved: 0,
            totalSettled: 0,
            isRegistered: true
        });

        emit AnchorRegistered(_anchor, _name, _creditRating);
    }

    function setComplianceSigner(address _signer) external {
        require(msg.sender == owner, "Not owner");
        complianceSigner = _signer;
        emit ComplianceSignerUpdated(_signer);
    }

    function updateComplianceStatusWithSignature(
        address _user,
        bool _status,
        uint256 _timestamp,
        bytes memory _signature
    ) external {
        require(block.timestamp <= _timestamp + 86400, "Signature expired");

        bytes32 messageHash = keccak256(abi.encodePacked(_user, _status, _timestamp));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        address recoveredSigner = recoverSigner(ethSignedMessageHash, _signature);
        require(recoveredSigner == complianceSigner, "Invalid compliance signature");

        isCompliant[_user] = _status;
        emit ComplianceStatusUpdated(_user, _status);
    }
}
