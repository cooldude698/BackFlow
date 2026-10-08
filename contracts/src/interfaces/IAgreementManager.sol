// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IAgreementManager {
    enum AgreementStatus {
        DRAFT,
        FUNDING,
        ACTIVE,
        PAUSED,
        COMPLETED,
        EXPIRED,
        CANCELLED
    }

    struct Agreement {
        uint256 id;
        address earner;
        address paymentToken;
        uint256 fundingTarget;
        uint256 totalFunded;
        uint256 revenueShareBps;
        uint256 capMultiplierBps;
        uint256 totalMaximumReturn;
        uint256 totalDistributed;
        uint256 duration;
        uint256 startTime;
        AgreementStatus status;
    }

    struct BackerPosition {
        uint256 fundedAmount;
        uint256 distributedAmount;
        uint256 maxCap;
        bool isCompleted;
    }

    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed earner,
        address paymentToken,
        uint256 fundingTarget,
        uint256 revenueShareBps,
        uint256 capMultiplierBps,
        uint256 duration
    );

    event BackerFunded(
        uint256 indexed agreementId,
        address indexed backer,
        uint256 amount,
        uint256 maxCap
    );

    event AgreementActivated(
        uint256 indexed agreementId,
        uint256 totalFunded,
        uint256 startTime
    );

    event AgreementStatusChanged(
        uint256 indexed agreementId,
        AgreementStatus oldStatus,
        AgreementStatus newStatus
    );

    function getAgreement(uint256 agreementId) external view returns (Agreement memory);
    function getBackerPosition(uint256 agreementId, address backer) external view returns (BackerPosition memory);
    function getBackers(uint256 agreementId) external view returns (address[] memory);
    function getBackerCount(uint256 agreementId) external view returns (uint256);
    function areAllBackersCompleted(uint256 agreementId) external view returns (bool);

    function recordSettlementDistribution(
        uint256 agreementId,
        address backer,
        uint256 amount
    ) external;

    function markAgreementCompleted(uint256 agreementId) external;
}
