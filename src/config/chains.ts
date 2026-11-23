import {
  base,
  mainnet,
  monad,
  optimism,
  plasma,
  polygon,
  robinhood,
  sei,
  sonic,
} from "viem/chains";
import { fallback, http } from "wagmi";
import type { Chain } from "viem";

import { supportedChains } from "./supported-chains";
export { supportedChains, chainById } from "./supported-chains";

/**
 * Every network the wallet connection accepts. Ethereum and Optimism are not
 * trading networks, but keeping them avoids network-switch prompts when a
 * wallet on one of them connects to log in or sign a message.
 */
export const walletChains = [...supportedChains, mainnet, optimism] as const;

/** Names saved in terms signatures before they were aligned with partner-config. */
export const legacyChainNames: Record<number, readonly string[]> = {
  42161: ["Arbitrum"],
  56: ["BNB Chain"],
  [sei.id]: [sei.name],
  [robinhood.id]: [robinhood.name],
  [sonic.id]: [sonic.name],
  [monad.id]: [monad.name],
  [plasma.id]: [plasma.name],
  [base.id]: [base.name],
  [polygon.id]: [polygon.name],
};

// Shared public endpoints and fallback policy from perpetual-hub/frontend.
export const rpcUrls: Record<number, readonly string[]> = {
  1: [
    "https://ethereum-rpc.publicnode.com",
    "https://eth.drpc.org",
    "https://ethereum.reth.rs/rpc",
  ],
  10: ["https://optimism.gateway.tenderly.co", "https://op.api.pocket.network"],
  56: ["https://bsc-rpc.publicnode.com", "https://bsc.api.pocket.network"],
  137: [
    "https://polygon.drpc.org",
    "https://polygon-bor-rpc.publicnode.com",
    "https://polygon.gateway.tenderly.co",
  ],
  143: [
    "https://monad-mainnet.rpc.sentio.xyz",
    "https://infra.originstake.com/monad/evm",
  ],
  146: [
    "https://sonic.drpc.org",
    "https://sonic-rpc.publicnode.com",
    "https://sonic.api.pocket.network",
  ],
  1329: [
    "https://sei.drpc.org",
    "https://evm-rpc.sei-apis.com",
    "https://sei.api.pocket.network",
  ],
  4663: [
    "https://robinhood.api.pocket.network",
    "https://robinhood.drpc.org",
    "https://robinhood-rpc.publicnode.com",
  ],
  8453: ["https://base-rpc.publicnode.com", "https://base.gateway.tenderly.co"],
  9745: ["https://rpc.plasma.to", "https://plasma.gateway.tenderly.co"],
  42161: ["https://arbitrum.drpc.org", "https://arb-one.api.pocket.network"],
};
export const chainLogo = (id: number) =>
  `/chain-logos/${id}.${({ 137: "png", 143: "png", 146: "png", 4663: "jpg" } as Record<number, string>)[id] ?? "svg"}`;
export const getTransport = (chain: Chain) =>
  fallback(
    (rpcUrls[chain.id] ?? chain.rpcUrls.default.http).map((url) =>
      http(url, { timeout: 5_000 }),
    ),
    { retryCount: 2 },
  );
