import { servingOrigin } from "./request-origin.js";
import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getAddress, type Address } from "viem";
import { authenticateAnalyticsSession } from "./analytics-session.js";
import { isAdminWallet, verifyAdminProof } from "./admin-session.js";
import { requestDatabase } from "./request-database.js";

/** Anything with pg's query(); tests pass an in-memory stand-in. */
type Queryable = { query: <R extends object = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<{ rows: R[]; rowCount: number | null }> };

type SessionKind = "wallet" | "admin";
const COOKIE: Record<SessionKind, string> = { wallet: "portal_wallet_session", admin: "portal_admin_session" };
const LIFETIME_SECONDS: Record<SessionKind, number> = { wallet: 12 * 60 * 60, admin: 8 * 60 * 60 };
const LOGIN_PROOF_WINDOW_MS = 15 * 60_000;

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

function readCookie(request: IncomingMessage, name: string): string | undefined {
  for (const part of request.headers.cookie?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator > 0 && part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
}

function writeCookie(request: IncomingMessage, response: ServerResponse, name: string, value: string, maxAge: number) {
  const secure = servingOrigin(request)?.startsWith("https://") ?? false;
  const cookie = [`${name}=${value}`, "Path=/api", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`, ...(secure ? ["Secure"] : [])].join("; ");
  const existing = response.getHeader?.("Set-Cookie");
  response.setHeader("Set-Cookie", [...(Array.isArray(existing) ? existing : existing ? [String(existing)] : []), cookie]);
}

async function cookieWallet(request: IncomingMessage, kind: SessionKind, database: Queryable): Promise<Address | undefined> {
  const token = readCookie(request, COOKIE[kind]);
  if (!token || !/^[a-f\d]{64}$/.test(token)) return;
  const result = await database.query<{ wallet_address: string }>(
    "SELECT wallet_address FROM portal_sessions WHERE token_hash = $1 AND kind = $2 AND expires_at > now()", [sha256(token), kind]);
  const wallet = result.rows[0]?.wallet_address;
  return wallet ? getAddress(wallet) : undefined;
}

async function verifiedProof(proof: unknown, request: IncomingMessage, kind: SessionKind): Promise<{ address: Address; nonce: string } | undefined> {
  if (kind === "admin") {
    const address = await verifyAdminProof(proof, request);
    return address ? { address, nonce: (proof as { nonce: string }).nonce } : undefined;
  }
  const session = await authenticateAnalyticsSession(proof, request);
  const signedAt = session ? Date.parse(session.signedAt) : NaN;
  if (!session || signedAt > Date.now() + 30_000 || Date.now() - signedAt > LOGIN_PROOF_WINDOW_MS) return;
  return { address: session.address, nonce: session.nonce };
}

/**
 * The wallet this request acts for: an unexpired session cookie, or else a fresh signed proof that is
 * accepted once and exchanged for a new HttpOnly session. A proof for a different wallet replaces the
 * cookie's wallet. Storage failures throw so callers can answer 503 instead of "sign in again".
 */
export async function authenticateWallet(request: IncomingMessage, response: ServerResponse, proof: unknown,
  kind: SessionKind = "wallet", database: Queryable = requestDatabase()): Promise<Address | undefined> {
  const claimed = proof && typeof proof === "object" && "address" in proof && typeof proof.address === "string"
    ? proof.address.toLowerCase() : undefined;
  const current = await cookieWallet(request, kind, database);
  if (current && (!claimed || current.toLowerCase() === claimed) && (kind !== "admin" || isAdminWallet(current))) return current;
  if (!proof) return;
  const verified = await verifiedProof(proof, request, kind);
  if (!verified) return;
  await database.query("DELETE FROM portal_used_proofs WHERE used_at < now() - interval '1 hour'");
  await database.query("DELETE FROM portal_sessions WHERE expires_at < now()");
  const fresh = await database.query("INSERT INTO portal_used_proofs (nonce) VALUES ($1) ON CONFLICT (nonce) DO NOTHING RETURNING nonce", [verified.nonce]);
  if (!fresh.rowCount) return;
  const token = randomBytes(32).toString("hex");
  await database.query(
    "INSERT INTO portal_sessions (token_hash, wallet_address, kind, expires_at) VALUES ($1, $2, $3, $4)",
    [sha256(token), verified.address.toLowerCase(), kind, new Date(Date.now() + LIFETIME_SECONDS[kind] * 1000)]);
  writeCookie(request, response, COOKIE[kind], token, LIFETIME_SECONDS[kind]);
  return getAddress(verified.address);
}

/** Ends this browser's session on the server and clears its cookie. */
export async function endWalletSession(request: IncomingMessage, response: ServerResponse, kind: SessionKind = "wallet",
  database: Queryable = requestDatabase()): Promise<void> {
  const token = readCookie(request, COOKIE[kind]);
  if (token && /^[a-f\d]{64}$/.test(token)) await database.query("DELETE FROM portal_sessions WHERE token_hash = $1", [sha256(token)]);
  writeCookie(request, response, COOKIE[kind], "", 0);
}
