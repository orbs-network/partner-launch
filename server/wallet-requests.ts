import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool } from "pg";
import { isAddress } from "viem";
import { requestDatabase } from "./request-database.js";
import { listWalletRequests } from "./request-repository.js";

/** Public summaries scoped by the supplied address; connection alone is not server authentication. */
export async function walletRequestsHandler(request: IncomingMessage, response: ServerResponse, database?: Pool): Promise<void> {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  const reply = (code: number, body: object) => { response.writeHead(code).end(JSON.stringify(body)); };
  if (request.method !== "POST") { response.setHeader("Allow", "POST"); reply(405, { error: "Use POST." }); return; }
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json" ||
      (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin")) { reply(403, { error: "Use the partner portal." }); return; }
  let data: unknown;
  try {
    const parsed = (request as IncomingMessage & { body?: unknown }).body;
    let raw: string;
    if (parsed !== undefined) raw = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    else {
      const parts: Buffer[] = []; let size = 0;
      for await (const value of request) { const chunk = Buffer.from(value); size += chunk.length; if (size > 8192) throw new Error("too large"); parts.push(chunk); }
      raw = Buffer.concat(parts).toString("utf8");
    }
    if (Buffer.byteLength(raw) > 8192) throw new Error("too large");
    data = JSON.parse(raw);
  } catch { reply(400, { error: "Send a valid request." }); return; }
  if (!data || typeof data !== "object" || Array.isArray(data) || !("address" in data) ||
      typeof data.address !== "string" || !isAddress(data.address)) { reply(400, { error: "Enter a valid wallet address." }); return; }
  try { reply(200, { requests: await listWalletRequests(database ?? requestDatabase(), data.address) }); }
  catch { reply(503, { error: "Your workspaces are temporarily unavailable." }); }
}
