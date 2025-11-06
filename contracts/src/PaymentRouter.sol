// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./TokenizedCash.sol";
import "./libs/Types.sol";
import "./libs/Errors.sol";

contract PaymentRouter {
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

    TokenizedCash public immutable cash;
    mapping(bytes32 => Types.PaymentStatus) public paymentStatus;
    mapping(bytes32 => Types.PaymentRequest) public payments;

    constructor(TokenizedCash _cash) {
        cash = _cash;
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
    ) external returns (bytes32 paymentId) {
        if (amount == 0) revert(Errors.INVALID_AMOUNT);
        if (expiresAt <= block.timestamp) revert(Errors.EXPIRED);

        paymentId = _computeId(msg.sender, payee, amount, offchainRef);
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

    function settlePayment(bytes32 paymentId) external {
        Types.PaymentRequest storage p = payments[paymentId];
        if (p.payer == address(0)) revert(Errors.NOT_AUTHORIZED);
        if (msg.sender != p.payer && msg.sender != p.payee) revert(Errors.NOT_AUTHORIZED);

        paymentStatus[paymentId] = Types.PaymentStatus.Settled;
        cash.transfer(p.payee, p.amount);
        emit PaymentSettled(paymentId, p.payer, p.payee, p.amount);
    }

    function cancelPayment(bytes32 paymentId) external {
        Types.PaymentRequest storage p = payments[paymentId];
        if (msg.sender != p.payer) revert(Errors.NOT_PAYER);
        require(paymentStatus[paymentId] == Types.PaymentStatus.Escrowed, "NOT_ESCROW");
        require(p.expiresAt < block.timestamp, Errors.EXPIRED);

        paymentStatus[paymentId] = Types.PaymentStatus.Cancelled;
        cash.transfer(p.payer, p.amount);
        emit PaymentCancelled(paymentId);
    }
}


