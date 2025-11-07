// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./TokenizedCash.sol";
import "./libs/Types.sol";
import "./libs/Errors.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PaymentRouter is Ownable, ReentrancyGuard {
    using Types for Types.PaymentRequest;

    event PaymentInitiated(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        bool escrow,
        bytes32 offchainRef
    );
    event PaymentSettled(bytes32 indexed paymentId, address indexed payer, address indexed payee, uint256 amount);
    event PaymentCancelled(bytes32 indexed paymentId);
    event OrchestratorUpdated(address indexed previous, address indexed current);
    event PausedSet(bool paused);

    TokenizedCash public immutable cash;
    address public orchestrator;
    bool public paused;

    mapping(bytes32 => Types.PaymentStatus) public paymentStatus;
    mapping(bytes32 => Types.PaymentRequest) public payments;

    modifier whenNotPaused() {
        require(!paused, "PAUSED");
        _;
    }

    constructor(TokenizedCash _cash) {
        cash = _cash;
    }

    function setOrchestrator(address _orchestrator) external onlyOwner {
        emit OrchestratorUpdated(orchestrator, _orchestrator);
        orchestrator = _orchestrator;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedSet(_paused);
    }

    function _computeId(address payer, address payee, uint256 amount, bytes32 offchainRef) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(payer, payee, amount, offchainRef, block.chainid));
    }

    function initiatePayment(
        address payee,
        uint256 amount,
        bool escrow,
        bytes32 offchainRef,
        uint64 expiresAt
    ) external whenNotPaused nonReentrant returns (bytes32 paymentId) {
        if (amount == 0) revert(Errors.INVALID_AMOUNT);
        if (expiresAt <= block.timestamp) revert(Errors.EXPIRED);
        if (payee == address(0)) revert(Errors.NOT_AUTHORIZED);

        paymentId = _computeId(msg.sender, payee, amount, offchainRef);
        Types.PaymentRequest storage existing = payments[paymentId];
        require(existing.payer == address(0), "PAYMENT_EXISTS");

        Types.PaymentRequest storage p = payments[paymentId];
        p.payer = msg.sender;
        p.payee = payee;
        p.amount = amount;
        p.escrow = escrow;
        p.offchainRef = offchainRef;
        p.createdAt = uint64(block.timestamp);
        p.expiresAt = expiresAt;

        paymentStatus[paymentId] = escrow ? Types.PaymentStatus.Escrowed : Types.PaymentStatus.Initiated;

        cash.transferFrom(msg.sender, address(this), amount);

        emit PaymentInitiated(paymentId, msg.sender, payee, amount, escrow, offchainRef);
    }

    function settlePayment(bytes32 paymentId) external whenNotPaused nonReentrant {
        Types.PaymentRequest storage p = payments[paymentId];
        if (p.payer == address(0)) revert(Errors.NOT_AUTHORIZED);
        if (msg.sender != orchestrator && msg.sender != p.payer && msg.sender != p.payee) revert(Errors.NOT_AUTHORIZED);

        Types.PaymentStatus status = paymentStatus[paymentId];
        if (status == Types.PaymentStatus.Settled) revert("ALREADY_SETTLED");
        if (status == Types.PaymentStatus.Cancelled) revert("ALREADY_CANCELLED");
        require(
            status == Types.PaymentStatus.Escrowed || status == Types.PaymentStatus.Initiated,
            "INVALID_STATUS"
        );

        paymentStatus[paymentId] = Types.PaymentStatus.Settled;
        cash.transfer(p.payee, p.amount);
        emit PaymentSettled(paymentId, p.payer, p.payee, p.amount);
    }

    function cancelPayment(bytes32 paymentId) external whenNotPaused nonReentrant {
        Types.PaymentRequest storage p = payments[paymentId];
        if (msg.sender != p.payer) revert(Errors.NOT_PAYER);

        Types.PaymentStatus status = paymentStatus[paymentId];
        require(status == Types.PaymentStatus.Escrowed, "NOT_ESCROW");
        if (status == Types.PaymentStatus.Settled) revert("ALREADY_SETTLED");
        if (status == Types.PaymentStatus.Cancelled) revert("ALREADY_CANCELLED");
        require(block.timestamp >= p.expiresAt, Errors.EXPIRED);

        paymentStatus[paymentId] = Types.PaymentStatus.Cancelled;
        cash.transfer(p.payer, p.amount);
        emit PaymentCancelled(paymentId);
    }
}


