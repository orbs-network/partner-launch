import type { Address, Hex } from "viem";
export interface AdminProof { address: Address; origin: string; issuedAt: string; nonce: string; signature: Hex }
export function adminSignInMessage(proof: Omit<AdminProof, "signature">): string {
  return ["Orbs Partner Launch — admin sign-in", "", `Wallet: ${proof.address}`, `Website: ${proof.origin}`,
    `Created at: ${proof.issuedAt}`, `Request: ${proof.nonce}`, "", "Sign in to review setup requests.",
    "This signature does not transfer funds or approve token spending."].join("\n");
}
