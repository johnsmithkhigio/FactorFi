// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract FactorFiContract {
    IERC20 public usdcToken;

    struct Invoice {
        address investor;
        address supplier;
        uint256 amount;
        bool isFactored;
    }

    mapping(uint256 => Invoice) public invoices;
    uint256 public nextInvoiceId;

    event InvoiceFactored(uint256 indexed invoiceId, address investor, address supplier, uint256 amount);

    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }

    function factorInvoice(uint256 amount, address supplier) external returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(supplier != address(0), "Invalid supplier");

        // The investor provides the liquidity
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "Funding failed");

        uint256 id = nextInvoiceId++;
        invoices[id] = Invoice(msg.sender, supplier, amount, true);

        // Instantly payout the supplier
        require(usdcToken.transfer(supplier, amount), "Payout failed");

        emit InvoiceFactored(id, msg.sender, supplier, amount);
        return id;
    }
}
