import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const address = "0x50015A452E644F5511fbeeac6B2aD2bf154E40E4";
const origin = "http://portal.example";
function request(body, requestOrigin = origin) {
  return { method: "POST", headers: { host: "portal.example", origin: requestOrigin }, socket: { remoteAddress: "127.0.0.1" }, body };
}
function response() {
  return { headers: {}, setHeader(key, value) { this.headers[key] = value; }, writeHead(status) { this.status = status; return this; }, end(body) { this.body = JSON.parse(body); return this; } };
}

test("Perps analytics checks connected addresses against the selected partner grant without a signature", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  const originalFetch = globalThis.fetch;
  try {
    const { analyticsAccessHandler } = await vite.ssrLoadModule("/server/analytics.ts");
    const calls = [];
    globalThis.fetch = async (input, options) => {
      const url = new URL(input); calls.push(url.pathname);
      if (url.pathname === "/api/v1/partner-registry") return Response.json({ schemaVersion: 1, lanes: [{ partnerId: "quickswap", chainId: "137", status: "enabled" }] });
      assert.equal(url.pathname, "/api/v1/partner-admin/check");
      assert.equal(url.searchParams.get("address"), address);
      assert.equal(options.headers.get("X-Partner-ID"), "quickswap");
      return Response.json({ admin: true, partnerId: "quickswap", walletAddress: address });
    };
    const body = { address, workspace: { partnerId: "quickswap", chainIds: [137] } };
    const ok = response(); await analyticsAccessHandler(request(body), ok);
    assert.equal(ok.status, 200); assert.equal(ok.body.walletAddress, address);
    assert.deepEqual(calls, ["/api/v1/partner-registry", "/api/v1/partner-admin/check"]);
    const denied = response(); await analyticsAccessHandler(request(body, "https://elsewhere.example"), denied);
    assert.equal(denied.status, 403);
    const invalid = response(); await analyticsAccessHandler(request({ ...body, address: "invalid" }), invalid);
    assert.equal(invalid.status, 401);
    globalThis.fetch = async (input) => new URL(input).pathname.includes("partner-registry")
      ? Response.json({ schemaVersion: 1, lanes: [{ partnerId: "quickswap", chainId: "137", status: "enabled" }] })
      : Response.json({ admin: false });
    const notAdmin = response(); await analyticsAccessHandler(request(body), notAdmin);
    assert.equal(notAdmin.status, 403);
  } finally { globalThis.fetch = originalFetch; await vite.close(); }
});
