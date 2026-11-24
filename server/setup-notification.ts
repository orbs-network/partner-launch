import { servingOrigin } from "./request-origin.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool, PoolClient } from "pg";
import { isRecord } from "../src/features/onboarding/terms-policy.js";
import { requestDatabase } from "./request-database.js";
import { getRequestStatus, markRequestDelivered, saveSetupRequest, type NewSetupRequest } from "./request-repository.js";
import { authenticateWallet } from "./wallet-session.js";

const MAX_BODY_BYTES = 16 * 1024;
// Best-effort protection per warm function instance. Use a Vercel WAF rate rule
// for a shared limit across instances. Submissions record the wallet proven by sign-in as owner.
const attempts = new Map<string, { count: number; until: number }>();

async function readBody(request: IncomingMessage): Promise<unknown> {
  const parsed = (request as IncomingMessage & { body?: unknown }).body;
  if (parsed !== undefined) {
    const raw = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw new Error("too-large");
    return JSON.parse(raw);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const part of request) {
    const chunk = Buffer.from(part);
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("too-large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function allowAttempt(request: IncomingMessage): boolean {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  const forwarded = request.headers["x-vercel-forwarded-for"];
  const ip = process.env.VERCEL && typeof forwarded === "string"
    ? forwarded.split(",")[0].trim() : request.socket.remoteAddress ?? "unknown";
  const entry = attempts.get(ip);
  if (entry) return ++entry.count <= 5;
  if (attempts.size >= 10_000) return false;
  attempts.set(ip, { count: 1, until: now + 60_000 });
  return true;
}

export async function setupNotificationHandler(request: IncomingMessage, response: ServerResponse, options: {
  unavailable: string;
  prepare: (body: unknown, owner?: string) => { text: string; submittedAt: string; record?: NewSetupRequest };
  /** Require a signed-in wallet (session cookie or fresh proof) and pass it to prepare as the owner. */
  requireOwner?: boolean;
  authorize?: (body: unknown, request: IncomingMessage, response: ServerResponse) => Promise<void>;
  afterDelivery?: () => Promise<void>;
  beforeDelivery?: (body: unknown) => Promise<{ status: number; error: string; code?: string } | undefined>;
  finalize?: () => Promise<void>;
  database?: Pool;
}): Promise<void> {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  const reply = (status: number, body: object) => { response.writeHead(status).end(JSON.stringify(body)); };
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    reply(405, { error: "Use POST." });
    return;
  }
  const origin = servingOrigin(request);
  if (!origin || request.headers.origin !== origin ||
    (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin")) {
    reply(403, { error: "Submit from the partner portal." });
    return;
  }
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") {
    reply(415, { error: "Send JSON." });
    return;
  }
  if (!allowAttempt(request)) {
    response.setHeader("Retry-After", "60");
    reply(429, { error: "Too many attempts. Wait a minute and try again." });
    return;
  }
  let body: unknown;
  try { body = await readBody(request); }
  catch (cause) {
    const tooLarge = cause instanceof Error && cause.message === "too-large";
    reply(tooLarge ? 413 : 400, { error: tooLarge ? "Request is too large." : "Send valid JSON." });
    return;
  }
  let owner: string | undefined;
  if (options.requireOwner) {
    try { owner = await authenticateWallet(request, response, body && typeof body === "object" && "proof" in body ? body.proof : undefined); }
    catch { reply(503, { error: "Request storage is unavailable. Your details are kept here; please try again." }); return; }
    if (!owner) { reply(401, { error: "Sign in with your wallet to submit this setup.", signIn: true }); return; }
  }
  let notification: { text: string; submittedAt: string; record?: NewSetupRequest };
  try { notification = options.prepare(body, owner); }
  catch (cause) {
    reply(400, { error: cause instanceof Error ? cause.message : "Check your setup details." });
    return;
  }
  const token = process.env.SPOT_TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.SPOT_TELEGRAM_CHAT_ID?.trim();
  if (!token || !/^\d+:[A-Za-z0-9_-]+$/.test(token) || !chatId || !/^-?[1-9]\d*$/.test(chatId)) {
    reply(503, { error: options.unavailable });
    return;
  }
  if (options.authorize) {
    try { await options.authorize(body, request, response); }
    catch { await options.finalize?.(); reply(403, { error: "Sign in with the owner wallet and check the request status." }); return; }
  }
  let transaction: PoolClient | undefined;
  if (notification.record) {
    try {
      transaction = await (options.database ?? requestDatabase()).connect();
      await transaction.query("BEGIN");
      // The upsert locks the ID until delivery is recorded, serializing retries.
      await saveSetupRequest(transaction, notification.record);
      if (await getRequestStatus(transaction, notification.record.id, notification.record.accessToken)) {
        await transaction.query("COMMIT");
        transaction.release();
        transaction = undefined;
        reply(200, { delivered: true, submittedAt: notification.submittedAt });
        return;
      }
    } catch (cause) {
      if (transaction) { await transaction.query("ROLLBACK").catch(() => {}); transaction.release(); }
      if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505" && "constraint" in cause && cause.constraint === "portal_partner_id_unique") {
        reply(409, { code: notification.record.product === "spot" ? "spot_app_id_taken" : "partner_id_taken", error: "An app with this name already exists. Choose another app name." });
        return;
      }
      reply(503, { error: "Request storage is unavailable. Your details are kept here; please try again." });
      return;
    }
  }
  if (options.beforeDelivery) {
    let failure: { status: number; error: string; code?: string } | undefined;
    try { failure = await options.beforeDelivery(body); }
    catch { failure = { status: 503, error: "We couldn’t check availability. Please try again." }; }
    if (failure) {
      if (transaction) { await transaction.query("ROLLBACK").catch(() => {}); transaction.release(); }
      await options.finalize?.();
      reply(failure.status, { error: failure.error, ...(failure.code ? { code: failure.code } : {}) });
      return;
    }
  }
  try {
    const upstream = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000), redirect: "error",
      body: JSON.stringify({ chat_id: chatId, link_preview_options: { is_disabled: true },
        text: notification.text }),
    });
    const result: unknown = await upstream.json();
    if (!upstream.ok || !isRecord(result) || result.ok !== true || !isRecord(result.result) ||
      !Number.isSafeInteger(result.result.message_id) || (result.result.message_id as number) <= 0) throw new Error("delivery");
    if (notification.record && transaction) {
      await markRequestDelivered(transaction, notification.record.id, notification.record.accessToken);
      await transaction.query("COMMIT");
    }
    if (options.afterDelivery) await options.afterDelivery();
    // Never return Telegram's response, token, destination or error description.
    reply(200, { delivered: true, submittedAt: notification.submittedAt });
  } catch {
    if (transaction) await transaction.query("ROLLBACK").catch(() => {});
    reply(502, { error: "We couldn’t confirm delivery to the team. Your details are kept here. Try again; if delivery was delayed, a retry may send another message." });
  } finally {
    transaction?.release();
    await options.finalize?.();
  }
}
