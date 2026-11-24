import { isAddress, zeroAddress } from "viem";

export const MAX_OWNER_WALLETS = 10;

/** Preserve partially entered values in drafts; validate before continuing or submitting. */
export function validateOwnerWallets(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length > MAX_OWNER_WALLETS) return `Add up to ${MAX_OWNER_WALLETS} owner wallets.`;
  const seen = new Set<string>();
  for (const address of value) {
    if (typeof address !== "string" || !isAddress(address.trim()) || address.trim().toLowerCase() === zeroAddress)
      return "Enter a valid, non-zero EVM address for each owner wallet.";
    const key = address.trim().toLowerCase();
    if (seen.has(key)) return "Each owner wallet must be different.";
    seen.add(key);
  }
}

export function normalizeOwnerWallets(value: string[]): string[] {
  return [...new Map(value.map(address => [address.trim().toLowerCase(), address.trim()])).values()];
}

export function restoreOwnerWallets(value: unknown): string[] {
  return Array.isArray(value) ? value.slice(0, MAX_OWNER_WALLETS).map(item => typeof item === "string" ? item.slice(0, 100) : "") : [];
}
