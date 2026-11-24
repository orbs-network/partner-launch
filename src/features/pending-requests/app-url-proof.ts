import type { Address, Hex } from "viem";

export interface AppUrlProof { address: Address; origin: string; issuedAt: string; nonce: string; requestId: string; appUrl: string; version: number; signature: Hex }
export function appUrlMessage(proof: Omit<AppUrlProof, "signature">): string {
  return ["Orbs Partner Portal — update Perps app URL", "", `Wallet: ${proof.address}`, `Portal: ${proof.origin}`,
    `Request ID: ${proof.requestId}`, `App URL: ${proof.appUrl}`, `Version: ${proof.version}`, `Created at: ${proof.issuedAt}`, `Nonce: ${proof.nonce}`, "",
    "Save this URL to my setup request. This does not transfer funds or approve token spending."].join("\n");
}
