// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IFactorFi {
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

    struct Anchor {
        string name;
        uint256 creditRating; // 0-1000
        uint256 totalApproved;
        uint256 totalSettled;
        bool isRegistered;
    }

    function getInvoice(uint256 _invoiceId) external view returns (Invoice memory);
    function getAnchor(address _addr) external view returns (Anchor memory);
    function fundInvoice(uint256 _invoiceId, uint256 _discountBps) external;
}

/**
 * @title AutoFactorVault — ERC-4626 Yield-Bearing Factoring Vault on Arc
 * @notice Receives investor USDC deposits, mints vault shares, and automates invoice matching
 */
contract AutoFactorVault is IERC20 {
    // --- ERC-4626 State Variables ---
    IERC20 public immutable asset;
    address public immutable factorFi;
    
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // --- Dynamic Matching State Variables ---
    uint256 public minDiscountBps;
    uint256 public minCreditScore;
    address public owner;
    address public keeper;
    
    uint256 public activeAllocations; // USDC currently deployed in factoring invoices
    mapping(uint256 => uint256) public fundedInvoices; // invoiceId => fundedUSDC
    uint256[] public fundedInvoiceIds;

    // --- Events ---
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);
    event RulesUpdated(uint256 minDiscountBps, uint256 minCreditScore);
    event KeeperUpdated(address indexed newKeeper);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == keeper, "Not authorized");
        _;
    }

    constructor(
        address _asset, 
        address _factorFi, 
        string memory _name, 
        string memory _symbol
    ) {
        asset = IERC20(_asset);
        factorFi = _factorFi;
        name = _name;
        symbol = _symbol;
        decimals = 6; // matches USDC decimals
        owner = msg.sender;
        keeper = msg.sender; // fallback
        
        minDiscountBps = 250; // 2.5%
        minCreditScore = 900;
    }

    // ========== ERC-4626 COMPLIANT MATH ==========

    function totalAssets() public view returns (uint256) {
        // TVL includes both idle USDC reserve and the deployed active allocations
        return asset.balanceOf(address(this)) + activeAllocations;
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply;
        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply;
        return supply == 0 ? shares : (shares * totalAssets()) / supply;
    }

    function previewDeposit(uint256 assets) public view returns (uint256) {
        return convertToShares(assets);
    }

    function previewMint(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply;
        return supply == 0 ? shares : (shares * totalAssets() + supply - 1) / supply;
    }

    function previewWithdraw(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply;
        return supply == 0 ? assets : (assets * supply + totalAssets() - 1) / totalAssets();
    }

    function previewRedeem(uint256 shares) public view returns (uint256) {
        return convertToAssets(shares);
    }

    function maxDeposit(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxWithdraw(address ownerAddress) external view returns (uint256) {
        uint256 userMax = convertToAssets(balanceOf[ownerAddress]);
        uint256 localLiquidity = asset.balanceOf(address(this));
        return userMax > localLiquidity ? localLiquidity : userMax;
    }

    function maxRedeem(address ownerAddress) external view returns (uint256) {
        uint256 userMaxShares = balanceOf[ownerAddress];
        uint256 localLiquidityShares = convertToShares(asset.balanceOf(address(this)));
        return userMaxShares > localLiquidityShares ? localLiquidityShares : userMaxShares;
    }

    // ========== ERC-4626 WRITE ACTIONS ==========

    function deposit(uint256 assets, address receiver) public returns (uint256) {
        uint256 shares = previewDeposit(assets);
        require(shares > 0, "Zero shares minted");
        
        require(asset.transferFrom(msg.sender, address(this), assets), "Deposit transfer failed");
        
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
        return shares;
    }

    function mint(uint256 shares, address receiver) public returns (uint256) {
        uint256 assets = previewMint(shares);
        require(assets > 0, "Zero assets deposited");
        
        require(asset.transferFrom(msg.sender, address(this), assets), "Deposit transfer failed");
        
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
        return assets;
    }

    function withdraw(uint256 assets, address receiver, address ownerAddress) public returns (uint256) {
        uint256 shares = previewWithdraw(assets);
        require(shares > 0, "Zero shares burned");
        
        if (msg.sender != ownerAddress) {
            uint256 allowed = allowance[ownerAddress][msg.sender];
            if (allowed != type(uint256).max) {
                require(allowed >= shares, "Allowance exceeded");
                allowance[ownerAddress][msg.sender] = allowed - shares;
            }
        }
        
        // Ensure local reserves can fulfill the withdraw request
        require(asset.balanceOf(address(this)) >= assets, "Insufficient local liquidity (active allocations locked)");
        
        _burn(ownerAddress, shares);
        require(asset.transfer(receiver, assets), "Withdraw transfer failed");
        
        emit Withdraw(msg.sender, receiver, ownerAddress, assets, shares);
        return shares;
    }

    function redeem(uint256 shares, address receiver, address ownerAddress) public returns (uint256) {
        uint256 assets = previewRedeem(shares);
        require(assets > 0, "Zero assets withdrawn");
        
        if (msg.sender != ownerAddress) {
            uint256 allowed = allowance[ownerAddress][msg.sender];
            if (allowed != type(uint256).max) {
                require(allowed >= shares, "Allowance exceeded");
                allowance[ownerAddress][msg.sender] = allowed - shares;
            }
        }
        
        require(asset.balanceOf(address(this)) >= assets, "Insufficient local liquidity (active allocations locked)");
        
        _burn(ownerAddress, shares);
        require(asset.transfer(receiver, assets), "Withdraw transfer failed");
        
        emit Withdraw(msg.sender, receiver, ownerAddress, assets, shares);
        return assets;
    }

    // ========== ERC-20 COMPLIANCE STANDARD ==========

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "Allowance exceeded");
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "Burn from zero address");
        require(balanceOf[from] >= amount, "Burn amount exceeds balance");
        
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    // ========== AUTO-FACTOR MATCH ALGORITHM ==========

    function setKeeper(address _keeper) external onlyOwner {
        require(_keeper != address(0), "Zero address");
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }

    function setMatchingRules(uint256 _minDiscountBps, uint256 _minCreditScore) external onlyOwner {
        minDiscountBps = _minDiscountBps;
        minCreditScore = _minCreditScore;
        emit RulesUpdated(_minDiscountBps, _minCreditScore);
    }

    function autoFundInvoice(uint256 _invoiceId, uint256 _discountBps) external onlyAuthorized {
        require(fundedInvoices[_invoiceId] == 0, "Invoice already vault-funded");
        
        // 1. Query Invoice Data from FactorFi Protocol
        IFactorFi.Invoice memory inv = IFactorFi(factorFi).getInvoice(_invoiceId);
        require(inv.status == IFactorFi.InvoiceStatus.Approved, "Invoice status is not Approved");
        require(_discountBps >= minDiscountBps, "Discount rate below vault rule minimum");
        
        // 2. Query Anchor Credit Rating
        IFactorFi.Anchor memory anchor = IFactorFi(factorFi).getAnchor(inv.anchor);
        require(anchor.creditRating >= minCreditScore, "Anchor credit rating below vault rule minimum");
        
        // 3. Compute Discounted Outflow Amount
        uint256 discountedAmount = inv.amount - (inv.amount * _discountBps / 10000);
        require(asset.balanceOf(address(this)) >= discountedAmount, "Insufficient vault liquidity to fund invoice");
        
        // 4. Update TVL Allocations Cache
        activeAllocations += discountedAmount;
        fundedInvoices[_invoiceId] = discountedAmount;
        fundedInvoiceIds.push(_invoiceId);
        
        // 5. Execute Auto-Factor Sponsoring
        require(asset.approve(factorFi, discountedAmount), "Spender approval failed");
        IFactorFi(factorFi).fundInvoice(_invoiceId, _discountBps);
    }

    function syncSettlement(uint256 _invoiceId) external {
        uint256 allocated = fundedInvoices[_invoiceId];
        require(allocated > 0, "Not a vault-funded invoice");
        
        IFactorFi.Invoice memory inv = IFactorFi(factorFi).getInvoice(_invoiceId);
        
        // Once invoice is Settled or Defaulted, release TVL active allocations mapping
        if (inv.status == IFactorFi.InvoiceStatus.Settled || inv.status == IFactorFi.InvoiceStatus.Defaulted) {
            activeAllocations -= allocated;
            fundedInvoices[_invoiceId] = 0;
        }
    }

    // ========== ADMIN CONTROLS ==========

    function emergencyRecoverUSDC(address _to, uint256 _amount) external onlyOwner {
        require(asset.transfer(_to, _amount), "Emergency recovery transfer failed");
    }
}
