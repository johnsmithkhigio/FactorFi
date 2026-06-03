// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
