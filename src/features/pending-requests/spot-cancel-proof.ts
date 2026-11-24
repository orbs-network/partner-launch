import type { Address, Hex } from "viem";

export interface SpotCancelProof { address: Address; origin: string; issuedAt: string; nonce: string; requestId: string; signature: Hex }

export function spotCancelMessage(proof: Omit<SpotCancelProof, "signature">): string {
  return ["Orbs Partner Launch — cancel Spot request", "", `Wallet: ${proof.address}`, `Website: ${proof.origin}`,
    `Request ID: ${proof.requestId}`, `Created at: ${proof.issuedAt}`, `Nonce: ${proof.nonce}`, "",
    "Confirm you want to send a cancellation request to the team.",
    "This signature does not transfer funds or approve token spending."].join("\n");
}
