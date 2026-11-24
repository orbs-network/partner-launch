import type { IncomingMessage, ServerResponse } from "node:http";
import { requestDatabase } from "./request-database.js";
import { getRequestStatus } from "./request-repository.js";

/** Read only the status bound to the request's secret; no contact or setup details. */
export async function requestStatusHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  const reply = (code: number, body: object) => { response.writeHead(code).end(JSON.stringify(body)); };
  if (request.method !== "POST") { response.setHeader("Allow", "POST"); reply(405, { error: "Use POST." }); return; }
  const host = request.headers.host;
  const encrypted = "encrypted" in request.socket && request.socket.encrypted;
  if (!host || /[\s,/@?#]/.test(host) || request.headers.origin !== `${process.env.VERCEL || encrypted ? "https" : "http"}://${host}` ||
      (request.headers["sec-fetch-site"] && request.headers["sec-fetch-site"] !== "same-origin")) { reply(403, { error: "Use the partner portal." }); return; }
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") { reply(415, { error: "Send JSON." }); return; }
  let raw: string;
  try {
    const parsed = (request as IncomingMessage & { body?: unknown }).body;
    if (parsed !== undefined) raw = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    else {
      const chunks: Buffer[] = []; let size = 0;
      for await (const item of request) { const chunk = Buffer.from(item); size += chunk.length; if (size > 2048) throw new Error("too large"); chunks.push(chunk); }
      raw = Buffer.concat(chunks).toString("utf8");
    }
    if (Buffer.byteLength(raw) > 2048) throw new Error("too large");
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
    const data = body as Record<string, unknown>;
    if (typeof data.requestId !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(data.requestId) ||
        typeof data.accessToken !== "string" || !/^[\da-f]{64}$/i.test(data.accessToken)) throw new Error("invalid");
    const status = await getRequestStatus(requestDatabase(), data.requestId, data.accessToken);
    if (!status) { reply(404, { error: "Request not found." }); return; }
    reply(200, { status });
  } catch (cause) {
    if (cause instanceof SyntaxError || (cause instanceof Error && ["invalid", "too large"].includes(cause.message))) reply(400, { error: "Invalid request." });
    else reply(503, { error: "Request status is unavailable." });
  }
}
