import type { IncomingMessage } from "node:http";

/** The optional public origin supports TLS termination without trusting forwarded headers. */
export function servingOrigin(request: IncomingMessage): string | undefined {
  const host = request.headers.host;
  if (!host || /[\s,/@?#]/.test(host)) return;
  try {
    const configured = process.env.PORTAL_PUBLIC_ORIGIN;
    if (configured) {
      const url = new URL(configured);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
          url.pathname !== "/" || url.search || url.hash || url.host !== host) return;
      return url.origin;
    }
    const encrypted = "encrypted" in request.socket && request.socket.encrypted;
    return new URL(`${process.env.VERCEL || encrypted ? "https" : "http"}://${host}`).origin;
  } catch { return; }
}
