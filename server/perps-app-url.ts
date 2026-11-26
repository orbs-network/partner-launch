import { servingOrigin } from "./request-origin.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool } from "pg";
import { isAddress, verifyMessage, type Address, type Hex } from "viem";
import { validateDexUrl } from "../src/lib/dex-url.js";
import { appUrlMessage } from "../src/features/pending-requests/app-url-proof.js";
import { requestDatabase } from "./request-database.js";

/** Wallet proof authorizes a single versioned update; reading requests still needs no signature. */
export async function perpsAppUrlHandler(request: IncomingMessage, response: ServerResponse, database?: Pool): Promise<void> {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  const reply = (status: number, body: object) => { response.writeHead(status).end(JSON.stringify(body)); };
  if (request.method !== "POST") { response.setHeader("Allow", "POST"); reply(405, { error: "Use POST." }); return; }
  const host = request.headers.host;
  const origin = servingOrigin(request);
  if (!host || /[\s,/@?#]/.test(host) || !origin || request.headers.origin !== origin ||
    (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin") ||
    request.headers["content-type"]?.split(";")[0].trim() !== "application/json") { reply(403, { error: "Use the partner portal." }); return; }
  let value: unknown;
  try {
    const parsed = (request as IncomingMessage & { body?: unknown }).body;
    let raw: string;
    if (parsed !== undefined) raw = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    else { const chunks: Buffer[] = []; let size = 0; for await (const part of request) { const chunk = Buffer.from(part); size += chunk.length; if (size > 8192) throw new Error(); chunks.push(chunk); } raw = Buffer.concat(chunks).toString("utf8"); }
    if (Buffer.byteLength(raw) > 8192) throw new Error();
    value = JSON.parse(raw);
  } catch { reply(400, { error: "Send a valid request." }); return; }
  if (!value || typeof value !== "object" || Array.isArray(value)) { reply(400, { error: "Check the DEX URL and try again." }); return; }
  const proof = value as Record<string, unknown>;
  if (typeof proof.address !== "string" || !isAddress(proof.address) || proof.origin !== origin ||
      typeof proof.requestId !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(proof.requestId) ||
      typeof proof.nonce !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(proof.nonce) ||
      typeof proof.issuedAt !== "string" || typeof proof.appUrl !== "string" || proof.appUrl !== proof.appUrl.trim() || !proof.appUrl || validateDexUrl(proof.appUrl) ||
      typeof proof.version !== "number" || !Number.isSafeInteger(proof.version) || proof.version < 0 || proof.version >= 2147483647 ||
      typeof proof.signature !== "string" || !/^0x(?:[\da-f]{2})+$/i.test(proof.signature)) { reply(400, { error: "Check the DEX URL and try again." }); return; }
  const time = Date.parse(proof.issuedAt);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== proof.issuedAt || time > Date.now() + 30_000 || Date.now() - time > 5 * 60_000) { reply(401, { error: "Your signature expired. Try again." }); return; }
  const details = { address: proof.address as Address, origin, issuedAt: proof.issuedAt, nonce: proof.nonce, requestId: proof.requestId, appUrl: proof.appUrl, version: proof.version };
  try {
    if (!await verifyMessage({ address: details.address, signature: proof.signature as Hex, message: appUrlMessage(details) })) { reply(401, { error: "Wallet signature could not be verified." }); return; }
    const result = await (database ?? requestDatabase()).query(`UPDATE portal_setup_requests
      SET details = jsonb_set(jsonb_set(jsonb_set(details, '{appUrl}', to_jsonb($3::text), true), '{appUrlVersion}', to_jsonb($4::integer + 1), true), '{workspaceVersion}', to_jsonb(COALESCE((details->>'workspaceVersion')::integer, 0) + 1), true)
      WHERE id = $1 AND product = 'perps' AND lower(owner_wallet) = lower($2) AND delivered_at IS NOT NULL AND status IN ('pending', 'approved')
        AND details->'pendingEdit' IS NULL AND COALESCE((details->>'appUrlVersion')::integer, 0) = $4 RETURNING id`, [details.requestId, details.address, details.appUrl, details.version]);
    if (!result.rowCount) { reply(409, { error: "This setup changed or is unavailable. Refresh and try again." }); return; }
    reply(200, { saved: true });
  } catch { reply(503, { error: "Couldn’t save the DEX URL. Try again." }); }
}
