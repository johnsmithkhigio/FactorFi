// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

/**
 * @title FactorFi — Reverse Factoring Protocol on Arc
 * @notice On-chain invoice factoring with multi-role lifecycle:
 *         Anchor → Supplier → Investor → Settlement
 * @dev Uses USDC (6 decimals) on Arc Testnet
 */
contract FactorFi {
    IERC20 public immutable usdc;
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
        uint256 amount;        // Face value in USDC (6 decimals)
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

    // --- Credit Passport ---
    struct CreditProfile {
        uint256 invoicesSettled;
        uint256 invoicesDefaulted;
        uint256 totalVolume;
        uint256 avgSettlementTime; // in seconds
        uint256 onTimeRateBps;     // basis points (9500 = 95%)
    }
    mapping(address => CreditProfile) public creditProfiles;

    // --- Events ---
    event AnchorRegistered(address indexed anchor, string name, uint256 creditRating);
    event InvoiceSubmitted(uint256 indexed invoiceId, address indexed supplier, address indexed anchor, uint256 amount, uint256 dueDate, string description);
    event InvoiceApproved(uint256 indexed invoiceId, address indexed anchor);
    event InvoiceFunded(uint256 indexed invoiceId, address indexed investor, uint256 fundedAmount, uint256 discountBps);
    event InvoiceSettled(uint256 indexed invoiceId, address indexed anchor, uint256 investorPayout, uint256 protocolFee);
    event CreditProfileUpdated(address indexed entity, uint256 invoicesSettled, uint256 onTimeRateBps);

    constructor(address _usdc, uint256 _protocolFeeBps) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
        protocolFeeBps = _protocolFeeBps;
    }

    // ========== ANCHOR FUNCTIONS ==========

    function registerAnchor(string calldata _name, uint256 _creditRating) external {
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
        uint256 protocolFee = (faceValue * protocolFeeBps) / 10000;
        uint256 investorPayout = faceValue - protocolFee;

        // Transfer from anchor: face value
        require(usdc.transferFrom(msg.sender, address(this), faceValue), "Anchor payment failed");

        // Pay investor: face value minus protocol fee
        if (investorPayout > 0) {
            require(usdc.transfer(inv.investor, investorPayout), "Investor payout failed");
        }

        // Protocol fee stays in contract (owner can withdraw)
        inv.status = InvoiceStatus.Settled;
        inv.settledAt = block.timestamp;
        anchors[msg.sender].totalSettled += faceValue;
        totalSettledVolume += faceValue;

        // Update credit profiles
        _updateCreditProfile(msg.sender, true, inv.settledAt - inv.fundedAt);
        _updateCreditProfile(inv.supplier, true, inv.settledAt - inv.createdAt);

        emit InvoiceSettled(_invoiceId, msg.sender, investorPayout, protocolFee);
    }

    // ========== SUPPLIER FUNCTIONS ==========

    function submitInvoice(
        address _anchor,
        uint256 _amount,
        uint256 _dueDate,
        string calldata _description
    ) external returns (uint256) {
        require(anchors[_anchor].isRegistered, "Anchor not registered");
        require(_amount > 0, "Amount must be > 0");
        require(_dueDate > block.timestamp, "Due date must be future");

        uint256 id = nextInvoiceId++;
        invoices[id] = Invoice({
            id: id,
            supplier: msg.sender,
            anchor: _anchor,
            investor: address(0),
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

        emit InvoiceSubmitted(id, msg.sender, _anchor, _amount, _dueDate, _description);
        return id;
    }

    // ========== INVESTOR FUNCTIONS ==========

    function fundInvoice(uint256 _invoiceId, uint256 _discountBps) external {
        Invoice storage inv = invoices[_invoiceId];
        require(inv.status == InvoiceStatus.Approved, "Not approved");
        require(_discountBps > 0 && _discountBps < 5000, "Discount 1-4999 bps");

        uint256 discountedAmount = inv.amount - (inv.amount * _discountBps / 10000);

        // Investor pays discounted amount
        require(usdc.transferFrom(msg.sender, address(this), discountedAmount), "Funding failed");

        // Supplier gets immediate payment (discounted)
        require(usdc.transfer(inv.supplier, discountedAmount), "Supplier payout failed");

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

    function _updateCreditProfile(address _entity, bool _onTime, uint256 _settlementTime) internal {
        CreditProfile storage profile = creditProfiles[_entity];

        if (_onTime) {
            profile.invoicesSettled++;
        } else {
            profile.invoicesDefaulted++;
        }

        profile.totalVolume += 1; // simplified
        uint256 total = profile.invoicesSettled + profile.invoicesDefaulted;
        profile.onTimeRateBps = total > 0 ? (profile.invoicesSettled * 10000) / total : 0;
        profile.avgSettlementTime = (profile.avgSettlementTime + _settlementTime) / 2;

        emit CreditProfileUpdated(_entity, profile.invoicesSettled, profile.onTimeRateBps);
    }

    // ========== OWNER ==========

    function withdrawFees(address _to) external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = usdc.balanceOf(address(this));
        if (balance > 0) {
            require(usdc.transfer(_to, balance), "Withdraw failed");
        }
    }

    function setProtocolFee(uint256 _feeBps) external {
        require(msg.sender == owner, "Not owner");
        require(_feeBps <= 500, "Max 5%");
        protocolFeeBps = _feeBps;
    }
}
