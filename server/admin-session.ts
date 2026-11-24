import type { IncomingMessage } from "node:http";
import { isAddress, verifyMessage, type Address, type Hex } from "viem";
import { adminSignInMessage } from "../src/features/admin/admin-proof.js";
export { adminSignInMessage } from "../src/features/admin/admin-proof.js";

/** The allowlist is re-checked on every request, so removing a wallet ends its admin access. */
export function isAdminWallet(address: string): boolean {
  const allowlist = (process.env.PORTAL_ADMIN_WALLETS ?? "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  return allowlist.includes(address.toLowerCase());
}

/** Short-lived, origin-bound wallet proof; the allowlist is server configuration. */
export async function verifyAdminProof(value: unknown, request: IncomingMessage, now = Date.now()): Promise<Address | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const proof = value as Record<string, unknown>;
  if (typeof proof.address !== "string" || !isAddress(proof.address) || typeof proof.origin !== "string" ||
      typeof proof.issuedAt !== "string" || typeof proof.nonce !== "string" ||
      typeof proof.signature !== "string" || !/^0x(?:[\da-f]{2})+$/i.test(proof.signature) ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(proof.nonce)) return;
  const issuedAt = Date.parse(proof.issuedAt);
  if (!Number.isFinite(issuedAt) || new Date(issuedAt).toISOString() !== proof.issuedAt || issuedAt > now + 30000 || now - issuedAt > 5 * 60_000) return;
  const host = request.headers.host;
  if (!host || /[\s,/@?#]/.test(host)) return;
  const encrypted = "encrypted" in request.socket && request.socket.encrypted;
  const origin = `${process.env.VERCEL || encrypted ? "https" : "http"}://${host}`;
  if (proof.origin !== origin || request.headers.origin !== origin ||
      (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin")) return;
  if (!isAdminWallet(proof.address)) return;
  const address = proof.address as Address;
  try {
    return await verifyMessage({ address, message: adminSignInMessage({ address, origin, issuedAt: proof.issuedAt, nonce: proof.nonce }), signature: proof.signature as Hex }) ? address : undefined;
  } catch { return; }
}
