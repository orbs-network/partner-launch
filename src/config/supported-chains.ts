import { arbitrum, base, bsc, polygon, sonic, monad, sei, plasma, robinhood } from "viem/chains";

// Supported onboarding networks remain separate from live partner lanes.
// Preserve names because the terms signature includes them.
export const supportedChains = [
  { ...arbitrum, name: "Arbitrum One" },
  { ...base, name: "Base" },
  { ...bsc, name: "BNB Smart Chain" },
  { ...polygon, name: "Polygon" },
  { ...sonic, name: "Sonic" },
  { ...monad, name: "Monad" },
  { ...sei, name: "Sei Network" },
  { ...plasma, name: "Plasma" },
  { ...robinhood, name: "Robinhood Chain" },
] as const;

// Existing Plasma setups still need their original network metadata and signed names.
export const selectablePerpsChains = supportedChains.filter(chain => chain.id !== plasma.id);

export const chainById = (id: number | null) => supportedChains.find(chain => chain.id === id);
