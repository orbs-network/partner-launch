import { servingOrigin } from "./request-origin.js";
import type { IncomingMessage } from "node:http";
import { isAddress, verifyMessage, type Address, type Hex } from "viem";
import { spotCancelMessage } from "../src/features/pending-requests/spot-cancel-proof.js";

export async function verifySpotCancelProof(value: unknown, request: IncomingMessage, requestId: string): Promise<Address | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const proof = value as Record<string, unknown>;
  if (typeof proof.address !== "string" || !isAddress(proof.address) || typeof proof.origin !== "string" ||
      typeof proof.issuedAt !== "string" || typeof proof.nonce !== "string" || proof.requestId !== requestId ||
      typeof proof.signature !== "string" || !/^0x(?:[\da-f]{2})+$/i.test(proof.signature) ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(proof.nonce)) return;
  const time = Date.parse(proof.issuedAt);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== proof.issuedAt || time > Date.now() + 30_000 || Date.now() - time > 5 * 60_000) return;
  const host = request.headers.host;
  if (!host || /[\s,/@?#]/.test(host)) return;
  const origin = servingOrigin(request);
  if (!origin || proof.origin !== origin || request.headers.origin !== origin ||
      (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin")) return;
  const address = proof.address as Address;
  try {
    return await verifyMessage({ address, signature: proof.signature as Hex,
      message: spotCancelMessage({ address, origin, issuedAt: proof.issuedAt, nonce: proof.nonce, requestId }) }) ? address : undefined;
  } catch { return; }
}
