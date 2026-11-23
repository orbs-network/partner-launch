/** Partner funding happens once, independently of the selected trading networks. */
export const FUNDING_CHAIN_ID = 42161 as const;

// Circle's native USDC on Arbitrum:
// https://developers.circle.com/stablecoins/usdc-contract-addresses
export const FUNDING_TOKEN_ADDRESS =
  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;
export const FUNDING_TOKEN_DECIMALS = 6 as const;
export const FUNDING_TOKEN_SYMBOL = "USDC" as const;
export const FUNDING_AMOUNT = "100" as const;
/** Legacy minimum used only by the dormant live-funding implementation. */
export const MIN_FUNDING_AMOUNT = FUNDING_AMOUNT;
