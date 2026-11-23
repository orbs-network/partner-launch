# dPERPS API getting started

Use dPERPS from your own application or service. A frontend fork or hosting project is not required for this path. Your portal setup is a request: confirm your assigned partner ID and activated networks with the team before integration.

## Prepare your partner setup

Start with **Set up perps**. Perps has one setup flow: App name → Networks → Earnings → Review setup → Deposit funds. Choose your app name and one network, then provide your revenue wallet and extra trading fee (0%–0.1%, in 0.001% steps, default 0%). There is no separate API setup choice on Welcome.

The app name generates a requested Partner ID, which remains local until the team confirms it. The revenue wallet and extra fee are configuration requests, not API authentication or a configured payout route. Deposit funds requests one genuine wallet message signature for the mocked 100 USDC deposit step, current setup and terms; its local acknowledgement does not transfer funds or activate trading.

After submission, open **Add perps to your DEX with our API** for the official API guide, public client references and copyable integration prompt. The prompt uses your submitted Partner ID and selected network without modifying the signed setup. API integration can use your existing app or backend without hosting a new trading interface. Confirm partner/network activation with the team before going live.

## Public implementation references

These links point only to the [public frontend repository](https://github.com/orbs-network/perpetual-hub-frontend), which is the maintained reference for its current client contract:

- [API endpoints](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/config/apiEndpoints.ts): public REST base `https://perps-api.orbs.network` and WebSocket `wss://perps-api.orbs.network/ws`.
- [Request client](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/api/client.ts) and [partner-chain identity](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/utils/config.ts).
- [Login](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/api/auth.ts), [markets](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/api/markets.ts), [account reads](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/api/user.ts), and [orders](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/api/orders.ts).
- [Signing](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/utils/signing.ts), [EIP-712 domains](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/config/eip712.ts), and [WebSocket subscriptions](https://github.com/orbs-network/perpetual-hub-frontend/blob/main/src/hooks/useWebSocket.ts).

Read the current definitions before implementing requests; this quickstart does not replace the request types or the team's activation contract. It supplies no private backend code or operator credentials.

## Identify your partner and network

The public client sends `X-Partner-ID`, `X-Chain-ID`, and `X-Partner-Chain-Key`. The combined key is the assigned partner ID, a colon, and the numeric chain ID. All three must describe the same activated partner-chain lane. A display name or a requested network is not proof that the lane is active.

For a read-only connectivity check, replace both values below with those confirmed by the team:

```sh
PARTNER_ID='YOUR_ASSIGNED_PARTNER_ID'
CHAIN_ID='YOUR_ACTIVATED_NUMERIC_CHAIN_ID'
curl --fail-with-body 'https://perps-api.orbs.network/api/v1/markets' \
  -H "X-Partner-ID: $PARTNER_ID" \
  -H "X-Chain-ID: $CHAIN_ID" \
  -H "X-Partner-Chain-Key: $PARTNER_ID:$CHAIN_ID"
```

These public identifiers select a lane; they are not authentication secrets. Handle unsupported-partner, unavailable-network and service errors explicitly instead of falling back to another partner's configuration.

If the team assigns an existing lane, use its existing Partner ID and matching chain configuration. Requesting your own partner through the portal is separate from using an already assigned, activated lane.

## Authentication and signing

The portal confirmation covers the selected network, setup details and terms. That is onboarding evidence, not a trading API login signature. Implement the trading client's current terms/session login and action signing from the public reference. Wallet ownership, session authorization, EIP-712 domain, chain, partner scope, timestamps and request data must match. Never reuse a portal signature as an order or login credential.

Keep wallet and session private keys out of frontend build variables, URLs, logs and shared setup files. A server integration still needs the correct authorized signatures; removing the browser does not remove protocol authentication. Use exact decimal strings and the current request types for quantities, prices and amounts. Do not infer numeric scales or copy display-rounded values into signed requests.

Begin with market and account reads. Test authenticated operations only in the environment and wallet authorized for that work. Backend/TEE validation remains authoritative for every trading decision.

## WebSocket authentication

The public client signs a `WebSocketAuth` request and sends a `SUBSCRIBE` message with channels, partner ID, numeric chain scope, combined partner-chain key, user, timestamp and signature. Follow the current official API documentation and source for authenticated streams.

## Activation and chain discovery

Obtain activated network, contract and collateral configuration from the agreed public discovery boundary or the team. Do not guess addresses or copy another partner's lane. The public frontend currently has an explicitly temporary `global` chain-discovery fixture; selecting a new ID alone does not activate it. The requested revenue wallet, partner share and fee cap also remain pending team review.

Report connectivity, authentication and order/stream checks separately. When something is unavailable, retain the exact public error and ask the team to confirm lane activation or access policy. Do not publish signatures, keys, private configuration or full wallet payloads in bug reports.
