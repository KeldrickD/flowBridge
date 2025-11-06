// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Types {
    struct PaymentRequest {
        address payer;
        address payee;
        uint256 amount;
        bytes32 offchainRef; // reference to bank/ACH id
        uint64 createdAt;
        uint64 expiresAt;
        bool escrow;
    }

    enum PaymentStatus {
        None,
        Initiated,
        Escrowed,
        Settled,
        Cancelled
    }
}


