import type { Address, Hex } from "viem";
import { createLoginMessage } from "../login/login-message";
import { readLoginSession, type LoginSession } from "../login/login-session";

type SignMessage = (args: { account: Address; message: string }) => Promise<Hex>;

/**
 * POST JSON as the verified owner wallet. The server accepts its HttpOnly session cookie or this tab's saved login
 * proof; only when neither is valid does the wallet sign one login message (no funds or approvals), which the server
 * exchanges for a session so later changes need no further signature.
 */
export async function postAsWallet(url: string, body: Record<string, unknown>, address: Address, signMessage: SignMessage,
  assertCurrent: () => void): Promise<Response> {
  const send = (proof: LoginSession | null) => fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({ ...body, address, ...(proof ? { proof } : {}) }),
  });
  const first = await send(readLoginSession(address, window.location.origin));
  if (first.status !== 401) return first;
  const details = { address, origin: window.location.origin, signedAt: new Date().toISOString(), nonce: crypto.randomUUID() };
  const signature = await signMessage({ account: address, message: createLoginMessage(details) });
  assertCurrent();
  return send({ ...details, version: 1, signature });
}
