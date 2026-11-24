import { isAddress, zeroAddress, type Address } from "viem";

export interface Collateral { chainId: number; symbol: "USDC" | "USDT"; address: Address; decimals: number }
export function isCollateral(value: unknown): value is Collateral {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.chainId === "number" && Number.isSafeInteger(item.chainId) && item.chainId > 0 &&
    (item.symbol === "USDC" || item.symbol === "USDT") && typeof item.address === "string" && isAddress(item.address) &&
    item.address.toLowerCase() !== zeroAddress && typeof item.decimals === "number" && Number.isInteger(item.decimals) && item.decimals >= 0 && item.decimals <= 255;
}
export function sameCollateral(a: Collateral, b: Collateral): boolean {
  return a.chainId === b.chainId && a.symbol === b.symbol && a.address.toLowerCase() === b.address.toLowerCase() && a.decimals === b.decimals;
}
export async function fetchCollateral(chainId: number, signal?: AbortSignal): Promise<Collateral> {
  const response = await fetch(`/api/chain-collateral?chainId=${chainId}`, { cache: "no-store", signal });
  if (!response.ok) throw new Error("Collateral is unavailable for this network. Please try again.");
  const data: unknown = await response.json();
  if (!isCollateral(data) || data.chainId !== chainId) throw new Error("Collateral could not be verified. Please try again.");
  return data;
}
