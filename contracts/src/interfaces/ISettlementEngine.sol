// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface ISettlementEngine {
    event PaymentSettled(
        uint256 indexed agreementId,
        address indexed payer,
        uint256 grossAmount,
        uint256 totalBackerShare,
        uint256 earnerShare
    );

    event BackerPaid(
        uint256 indexed agreementId,
        address indexed backer,
        uint256 amountPaid,
        uint256 totalDistributedToBacker,
        bool capReached
    );

    function settlePayment(
        uint256 agreementId,
        uint256 grossAmount,
        address payer
    ) external returns (uint256 earnerPayout, uint256 totalBackerPayout);
}
