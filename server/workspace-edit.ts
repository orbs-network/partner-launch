import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool, PoolClient } from "pg";
import { isAddress } from "viem";
import { generateSpotAppId } from "../src/features/onboarding/spot/app-id.js";
import { normalizeWorkspaceEdit } from "../src/features/pending-requests/workspace-edit.js";
import { servingOrigin } from "./request-origin.js";
import { selectablePerpsChains } from "../src/config/supported-chains.js";
import { allowAttempt } from "./setup-notification.js";
import { requestDatabase } from "./request-database.js";

async function readBody(request: IncomingMessage): Promise<unknown> {
  const parsed = (request as IncomingMessage & { body?: unknown }).body;
  if (parsed !== undefined) { const text = typeof parsed === "string" ? parsed : JSON.stringify(parsed); if (Buffer.byteLength(text) > 8192) throw new Error(); return JSON.parse(text); }
  const chunks: Buffer[] = []; let size = 0;
  for await (const value of request) { const chunk = Buffer.from(value); size += chunk.length; if (size > 8192) throw new Error(); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/** Save address-claimed changes to the portal and notify the team; wallet ownership is not verified. */
export async function workspaceEditHandler(request: IncomingMessage, response: ServerResponse, database?: Pool): Promise<void> {
  response.setHeader("Content-Type", "application/json; charset=utf-8"); response.setHeader("Cache-Control", "private, no-store");
  const reply = (status: number, body: object) => { response.writeHead(status).end(JSON.stringify(body)); };
  if (request.method !== "POST") { response.setHeader("Allow", "POST"); reply(405, { error: "Use POST." }); return; }
  const origin = servingOrigin(request);
  if (!origin || request.headers.origin !== origin || (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin") || request.headers["content-type"]?.split(";")[0].trim() !== "application/json") { reply(403, { error: "Use the partner portal." }); return; }
  if (!allowAttempt(request)) { response.setHeader("Retry-After", "60"); reply(429, { error: "Too many attempts. Wait a minute and try again." }); return; }
  let body: unknown;
  try { body = await readBody(request); } catch { reply(400, { error: "Send a valid request." }); return; }
  if (!body || typeof body !== "object" || Array.isArray(body)) { reply(400, { error: "Check your workspace changes." }); return; }
  const value = body as Record<string, unknown>;
  if (typeof value.address !== "string" || !isAddress(value.address) || typeof value.requestId !== "string" ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value.requestId) ||
      typeof value.version !== "number" || !Number.isSafeInteger(value.version) || value.version < 0 || value.version >= 2147483647) { reply(400, { error: "Check your workspace changes." }); return; }
  let edit;
  try { edit = normalizeWorkspaceEdit(value.edit); } catch (error) { reply(400, { error: error instanceof Error ? error.message : "Check your workspace changes." }); return; }
  const claim = { address: value.address, requestId: value.requestId, version: value.version };
  const token = process.env.SPOT_TELEGRAM_BOT_TOKEN?.trim(); const chatId = process.env.SPOT_TELEGRAM_CHAT_ID?.trim();
  if (!token || !/^\d+:[A-Za-z0-9_-]+$/.test(token) || !chatId || !/^-?[1-9]\d*$/.test(chatId)) { reply(503, { error: "Workspace submission is temporarily unavailable. Try again." }); return; }
  let transaction: PoolClient | undefined;
  try {
    transaction = await (database ?? requestDatabase()).connect(); await transaction.query("BEGIN");
    const result = await transaction.query<{ details: Record<string, unknown>; product: string; partner_id: string | null }>("SELECT details, product, partner_id FROM portal_setup_requests WHERE id = $1 AND lower(owner_wallet) = lower($2) AND delivered_at IS NOT NULL AND status IN ('pending', 'approved') FOR UPDATE", [claim.requestId, claim.address]);
    const row = result.rows[0];
    if (!row || row.product !== edit.product || Number(row.details.workspaceVersion ?? 0) !== claim.version) { await transaction.query("ROLLBACK"); reply(409, { error: "This workspace changed or is unavailable. Refresh and try again." }); return; }
    if (edit.product === "perps" && !selectablePerpsChains.some(chain => chain.id === edit.chainId) && !(Array.isArray(row.details.chainIds) && row.details.chainIds.length === 1 && row.details.chainIds[0] === edit.chainId)) { await transaction.query("ROLLBACK"); reply(400, { error: "Choose a supported network." }); return; }
    const partnerId = row.partner_id ?? (row.product === "spot" && typeof row.details.appName === "string" ? generateSpotAppId(row.details.appName) : row.details.partnerId);
    if (typeof partnerId !== "string" || edit.partnerId !== partnerId) { await transaction.query("ROLLBACK"); reply(400, { error: "Partner ID cannot be changed." }); return; }
    const { contact } = edit;
    const next: Record<string, unknown> = { ...row.details, appName: edit.appName, partnerId, integrationMode: edit.integrationMode, workspaceVersion: claim.version + 1 };
    delete next.pendingEdit;
    if (edit.product === "spot") {
      Object.assign(next, { feesWallet: edit.wallet, tradingFeeTenthsBps: edit.fee });
      if (edit.url) next.dexUrl = edit.url; else delete next.dexUrl;
    } else {
      Object.assign(next, { revenueWallet: edit.wallet, builderFeeTenthsBps: edit.fee, chainIds: [edit.chainId], appUrlVersion: Number(row.details.appUrlVersion ?? 0) + 1 });
      if (edit.url) next.appUrl = edit.url; else delete next.appUrl;
    }
    await transaction.query("UPDATE portal_setup_requests SET details = $2::jsonb, partner_id = COALESCE(partner_id, $3) WHERE id = $1", [claim.requestId, JSON.stringify(next), partnerId]);
    const text = [`Workspace updated`, `Product: ${edit.product}`, `App name: ${edit.appName}`, `Partner ID: ${edit.partnerId}`, `Integration: ${edit.integrationMode}`, `App URL: ${edit.url || "Not provided"}`, `${edit.product === "spot" ? "Fees" : "Revenue"} wallet: ${edit.wallet}`, `${edit.product === "spot" ? "Trading fee" : "Additional fees"}: ${(edit.fee / 1000).toFixed(3)}%`, ...(edit.chainId ? [`Network: ${edit.chainId}`] : []), `Contact: ${contact || "Not provided"}`, `Owner wallet: ${claim.address}`, `Request ID: ${claim.requestId}`].join("\n");
    const upstream = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10_000), redirect: "error", body: JSON.stringify({ chat_id: chatId, link_preview_options: { is_disabled: true }, text }) });
    const sent: unknown = await upstream.json();
    if (!upstream.ok || !sent || typeof sent !== "object" || !("ok" in sent) || sent.ok !== true || !("result" in sent) || !sent.result || typeof sent.result !== "object" || !("message_id" in sent.result) || !Number.isSafeInteger(sent.result.message_id) || Number(sent.result.message_id) <= 0) throw new Error("delivery");
    await transaction.query("COMMIT"); reply(200, { submitted: true });
  } catch { if (transaction) await transaction.query("ROLLBACK").catch(() => {}); reply(503, { error: "Couldn’t confirm submission. Refresh your workspace before retrying; another attempt may send a duplicate notification." }); }
  finally { transaction?.release(); }
}
