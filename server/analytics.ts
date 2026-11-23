import type { IncomingMessage, ServerResponse } from "node:http";
import { isIP } from "node:net";
import { loadPartnerAnalytics } from "../vendor/partner-analytics/lib/analytics-service";
import {
  hasPartnerAdminAccess,
  partnerPayload,
  PartnerAdminProxyError,
} from "../vendor/partner-analytics/lib/auth";
import { authenticateAnalyticsSession } from "./analytics-session";
import { AnalyticsScopeError, resolveAnalyticsScope } from "./analytics-scope";

const MAX_BODY_BYTES = 16 * 1024;
type AnalyticsRoute = "access" | "stats";

function readBody(request: IncomingMessage): Promise<unknown> {
  // Vercel's Node runtime can parse JSON before invoking the handler.
  const parsed = (request as IncomingMessage & { body?: unknown }).body;
  if (parsed !== undefined) {
    const serialized = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    if (Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES) return Promise.reject(new Error("too-large"));
    return Promise.resolve(JSON.parse(serialized));
  }
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        chunks.length = 0;
        reject(new Error("too-large"));
      } else {
        chunks.push(chunk);
      }
    });
    request.on("end", () => {
      if (size > MAX_BODY_BYTES) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (error) { reject(error); }
    });
    request.on("error", reject);
    request.on("aborted", () => reject(new Error("Request aborted")));
  });
}

function analyticsHeaders(request: IncomingMessage): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  // Only Vercel's platform-provided visitor header is trusted. Ignore caller wallet
  // and generic forwarded headers; locally use the actual connection address.
  const vercelIp = request.headers["x-vercel-forwarded-for"];
  const candidate = process.env.VERCEL && typeof vercelIp === "string"
    ? vercelIp.split(",")[0]?.trim()
    : request.socket.remoteAddress;
  const ip = candidate?.replace(/^\[|\]$/g, "");
  if (ip && isIP(ip)) headers.set("X-Real-IP", ip);
  return headers;
}

function errorResponse(response: ServerResponse, status: number, error: string) {
  response.writeHead(status).end(JSON.stringify({ error }));
}

async function analyticsHandler(route: AnalyticsRoute, request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    errorResponse(response, 405, "Use POST.");
    return;
  }
  let body: unknown;
  try { body = await readBody(request); }
  catch (error) {
    const tooLarge = error instanceof Error && error.message === "too-large";
    errorResponse(response, tooLarge ? 413 : 400, tooLarge ? "Request is too large." : "Send valid JSON.");
    return;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    errorResponse(response, 400, "Send a JSON object.");
    return;
  }
  const item = body as Record<string, unknown>;
  const session = await authenticateAnalyticsSession(item.session, request);
  if (!session) {
    errorResponse(response, 401, "Sign in to the partner portal to view analytics.");
    return;
  }
  if (item.range !== undefined && (typeof item.range !== "string" || item.range.length > 16)) {
    errorResponse(response, 400, "Choose a valid analytics range.");
    return;
  }
  const headers = analyticsHeaders(request);
  try {
    const { partner, chainId } = resolveAnalyticsScope(item.workspace);
    let upstream: Response;
    if (route === "access") {
      if (!await hasPartnerAdminAccess(partner, session.address, headers)) {
        errorResponse(response, 403, `${session.address} is not a partner admin`);
        return;
      }
      upstream = Response.json(partnerPayload(partner, session.address));
    } else {
      const url = new URL("/api/stats", session.origin);
      if (typeof item.range === "string") url.searchParams.set("range", item.range);
      url.searchParams.set("chainId", chainId);
      upstream = await loadPartnerAnalytics(new Request(url, { headers }), partner, session.address);
    }
    response.writeHead(upstream.status).end(await upstream.text());
  } catch (error) {
    errorResponse(response,
      error instanceof PartnerAdminProxyError || error instanceof AnalyticsScopeError ? error.status : 502,
      (route === "access" || error instanceof AnalyticsScopeError) && error instanceof Error ? error.message : "Analytics data is temporarily unavailable.");
  }
}

export function analyticsAccessHandler(request: IncomingMessage, response: ServerResponse) {
  return analyticsHandler("access", request, response);
}

export function analyticsStatsHandler(request: IncomingMessage, response: ServerResponse) {
  return analyticsHandler("stats", request, response);
}
