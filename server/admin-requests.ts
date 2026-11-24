import { servingOrigin } from "./request-origin.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool } from "pg";
import { authenticateWallet } from "./wallet-session.js";
import { requestDatabase } from "./request-database.js";
import { approveSetupRequest, listReviewRequests } from "./request-repository.js";

async function jsonBody(request: IncomingMessage): Promise<unknown> {
  const parsed = (request as IncomingMessage & { body?: unknown }).body;
  if (parsed !== undefined) {
    const raw = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    if (Buffer.byteLength(raw) > 8192) throw new Error("too large");
    return JSON.parse(raw);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const part of request) {
    const chunk = Buffer.from(part);
    size += chunk.length;
    if (size > 8192) throw new Error("too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function adminRequestsHandler(request: IncomingMessage, response: ServerResponse, database?: Pool): Promise<void> {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  const reply = (status: number, body: object) => { response.writeHead(status).end(JSON.stringify(body)); };
  if (request.method !== "POST") { response.setHeader("Allow", "POST"); reply(405, { error: "Use POST." }); return; }
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") { reply(415, { error: "Send JSON." }); return; }
  const host = request.headers.host;
  const origin = servingOrigin(request);
  if (!host || /[\s,/@?#]/.test(host) || !origin || request.headers.origin !== origin ||
    (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin")) { reply(403, { error: "Use the partner portal." }); return; }
  let body: unknown;
  try { body = await jsonBody(request); } catch { reply(400, { error: "Send a valid request." }); return; }
  if (!body || typeof body !== "object" || Array.isArray(body)) { reply(400, { error: "Send a valid request." }); return; }
  const data = body as Record<string, unknown>;
  // An admin session cookie for the connected wallet, or a fresh single-use admin proof that starts
  // an 8-hour session. The connected address alone is only a claim and never grants access.
  const db = database ?? requestDatabase();
  let admin: string | undefined;
  try {
    admin = await authenticateWallet(request, response,
      data.proof ?? (typeof data.address === "string" ? { address: data.address } : undefined), "admin", db);
  } catch { reply(503, { error: "Request storage is unavailable. Please try again." }); return; }
  if (!admin) { reply(401, { error: "Sign in with an authorized admin wallet.", signIn: true }); return; }
  if (data.action !== "list" && data.action !== "approve") { reply(400, { error: "Invalid action." }); return; }
  if (data.action === "approve" && (typeof data.requestId !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(data.requestId))) {
    reply(400, { error: "Invalid request." }); return;
  }
  try {
    if (data.action === "list") { reply(200, { requests: await listReviewRequests(db) }); return; }
    const approved = await approveSetupRequest(db, data.requestId as string, admin);
    if (!approved) { reply(409, { error: "This request is no longer pending." }); return; }
    reply(200, { approved: true });
  } catch {
    reply(503, { error: "Request storage is unavailable. Please try again." });
  }
}
