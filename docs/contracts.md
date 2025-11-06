# Contracts Overview

## TokenizedCash.sol
- ERC-20 token (fbUSD) with AccessControl-based MINTER_ROLE.
- Used as tokenized USD for on-chain settlement.

## PaymentRouter.sol
- Initiate payments with optional escrow and expiration.
- Emits PaymentInitiated, PaymentSettled, PaymentCancelled.
- Links on-chain tx to off-chain banking references via offchainRef.

## SettlementManager.sol (planned)
- Batch settle payments: `batchSettle(bytes32[] paymentIds)`.
- Emits BatchSettled and supports role restrictions.

## MultiSigVault.sol (planned)
- Multi-signature approvals for institutional operations.

## Security & Testing
- Foundry tests (unit + fuzz + invariants planned).
- Access control: restricted minting, future role-gated settlement managers.
- Upgradeability (planned): transparent proxy with timelock and pause.


