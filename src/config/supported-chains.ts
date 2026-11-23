import { arbitrum, base, bsc, polygon, sonic, monad, sei, plasma, robinhood } from "viem/chains";

// Only networks with a Perpetual Hub partner lane (perpetual-hub/partner-config
// src/chains.ts). Names match that file because the terms signature includes them.
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

export const chainById = (id: number | null) => supportedChains.find(chain => chain.id === id);
