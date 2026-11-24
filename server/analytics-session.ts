import { servingOrigin } from "./request-origin.js";
import type { IncomingMessage } from "node:http";
import { verifyMessage } from "viem";
import { createLoginMessage } from "../src/features/login/login-message.js";
import type { LoginSession } from "../src/features/login/login-session";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOrigin(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.origin === value;
  } catch {
    return false;
  }
}


function parseSession(value: unknown): LoginSession | undefined {
  if (!isRecord(value)) return undefined;
  const { version, address, origin, signedAt, nonce, signature } = value;
  if (
    version !== 1 ||
    typeof address !== "string" || !/^0x[\da-f]{40}$/i.test(address) ||
    !isOrigin(origin) ||
    typeof signedAt !== "string" || !Number.isFinite(Date.parse(signedAt)) ||
    new Date(signedAt).toISOString() !== signedAt ||
    typeof nonce !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(nonce) ||
    typeof signature !== "string" || !/^0x(?:[\da-f]{2})+$/i.test(signature)
  ) return undefined;
  return {
    version,
    address: address as `0x${string}`,
    origin,
    signedAt,
    nonce,
    signature: signature as `0x${string}`,
  };
}

/** A valid wallet signature and this exact portal origin are required on every read. */
export async function authenticateAnalyticsSession(
  value: unknown,
  request: IncomingMessage,
): Promise<LoginSession | undefined> {
  const session = parseSession(value);
  const origin = request.headers.origin;
  if (!session || !isOrigin(origin) || session.origin !== origin || origin !== servingOrigin(request)) return undefined;
  try {
    const verified = await verifyMessage({
      address: session.address,
      message: createLoginMessage(session),
      signature: session.signature,
    });
    return verified ? session : undefined;
  } catch {
    return undefined;
  }
}
