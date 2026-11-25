import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("registry availability includes disabled lanes and normalizes mixed-case lookup", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const originalFetch = globalThis.fetch;
  try {
    const { registryPartnerStatus, partnerRegistryStatusHandler } = await server.ssrLoadModule("/server/partner-registry-status.ts");
    let queried;
    globalThis.fetch = async url => {
      queried = new URL(url).searchParams.get("partner");
      const lanes = queried === "quickswap1" ? [{ partnerId: "quickswap1", chainId: "137", status: "disabled" }] : [];
      return new Response(JSON.stringify({ schemaVersion: 1, lanes }), { status: 200 });
    };
    assert.deepEqual(await registryPartnerStatus("QuickSwap1"), { partnerId: "QuickSwap1", exists: true, enabledChainIds: [] });
    assert.equal(queried, "quickswap1");
    assert.equal((await registryPartnerStatus("available-example")).exists, false);
    let code, body;
    const response = { setHeader() {}, writeHead(status) { code = status; return this; }, end(value) { body = JSON.parse(value); } };
    await partnerRegistryStatusHandler({ method: "GET", url: "/api/partner-registry-status?partner=QuickSwap1" }, response);
    assert.equal(code, 200);
    assert.equal(body.exists, true);
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await partnerRegistryStatusHandler({ method: "GET", url: "/api/partner-registry-status?partner=QuickSwap1" }, response);
    assert.equal(code, 502);
  } finally { globalThis.fetch = originalFetch; await server.close(); }
});

test("Spot and Perps availability use only the database and stay separate by product", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const originalFetch = globalThis.fetch;
  try {
    const { partnerRegistryStatusHandler } = await server.ssrLoadModule("/server/partner-registry-status.ts");
    const { spotAppIdStatusHandler } = await server.ssrLoadModule("/server/spot-app-id-status.ts");
    globalThis.fetch = async () => { throw new Error("availability must not call external services"); };
    const database = { query: async (_sql, [product, id]) => ({ rowCount: product === "spot" && id.toLowerCase() === "sampledex" ? 1 : 0 }) };
    const response = () => ({ setHeader() {}, writeHead(status) { this.status = status; return this; }, end(value) { this.body = JSON.parse(value); } });
    const spot = response();
    await spotAppIdStatusHandler({ method: "GET", url: "/api/spot-app-id-status?name=Sample%20Dex" }, spot, database);
    assert.equal(spot.status, 200); assert.equal(spot.body.exists, true);
    const perps = response();
    await partnerRegistryStatusHandler({ method: "GET", url: "/api/partner-registry-status?partner=sampledex&availability=1" }, perps, database);
    assert.equal(perps.status, 200); assert.equal(perps.body.exists, false);
    const unavailable = response();
    await partnerRegistryStatusHandler({ method: "GET", url: "/api/partner-registry-status?partner=sampledex&availability=1" }, unavailable, { query: async () => { throw Error("offline"); } });
    assert.equal(unavailable.status, 503);
  } finally { globalThis.fetch = originalFetch; await server.close(); }
});
