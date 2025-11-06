# API Summary

## API Gateway (prefix /v1)

### POST /v1/payments
- Auth: JWT
- Body: `{ payerAddress, payeeAddress, amount, escrow }`
- Action: Delegate to orchestrator to initiate payment.

### GET /v1/payments/:id
- Auth: JWT
- Returns payment status/details.

### POST /v1/webhooks/partner
- Registers a partner webhook URL and event types.

## Mock Bank API

### POST /internal/hold
- Create a hold for an off-chain account matching on-chain PaymentInitiated.

### POST /internal/settle
- Settle a held amount and update balances.

### GET /accounts/:id/balance
- Returns mock account balance.


