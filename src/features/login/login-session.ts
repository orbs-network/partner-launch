import { verifyMessage } from "viem";
import { createLoginMessage } from "./login-message";

export interface LoginSession {
  version: 1;
  address: `0x${string}`;
  origin: string;
  signedAt: string;
  nonce: string;
  signature: `0x${string}`;
}

const SESSION_KEY = "perpetual-hub-partner-login";

/** Keep the original signed proof for this tab, independently of setup data. */
export function saveLoginSession(session: LoginSession): boolean {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/** Whether this tab holds any saved login proof, before the wallet address is known. */
export function hasLoginSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

export function readLoginSession(
  address: `0x${string}`,
  origin: string,
): LoginSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
    const item = saved as Record<string, unknown>;
    if (
      item.version !== 1 ||
      typeof item.address !== "string" ||
      !/^0x[\da-f]{40}$/i.test(item.address) ||
      item.address.toLowerCase() !== address.toLowerCase() ||
      item.origin !== origin ||
      typeof item.signedAt !== "string" ||
      !Number.isFinite(Date.parse(item.signedAt)) ||
      new Date(item.signedAt).toISOString() !== item.signedAt ||
      typeof item.nonce !== "string" ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(item.nonce) ||
      typeof item.signature !== "string" ||
      !/^0x(?:[\da-f]{2})+$/i.test(item.signature)
    ) return null;
    return {
      version: 1,
      address: item.address as `0x${string}`,
      origin,
      signedAt: item.signedAt,
      nonce: item.nonce,
      signature: item.signature as `0x${string}`,
    };
  } catch {
    return null;
  }
}

/** Restoring access always verifies the exact message that the wallet signed. */
export async function verifyLoginSession(session: LoginSession): Promise<boolean> {
  try {
    return await verifyMessage({
      address: session.address,
      message: createLoginMessage(session),
      signature: session.signature,
    });
  } catch {
    return false;
  }
}

export function clearLoginSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // An unavailable storage API must not prevent clearing in-memory access.
  }
}
