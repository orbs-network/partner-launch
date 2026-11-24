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

test("submission is blocked before Telegram delivery when availability fails", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const originalFetch = globalThis.fetch, priorToken = process.env.SPOT_TELEGRAM_BOT_TOKEN, priorChat = process.env.SPOT_TELEGRAM_CHAT_ID;
  try {
    process.env.SPOT_TELEGRAM_BOT_TOKEN = "123:test_token"; process.env.SPOT_TELEGRAM_CHAT_ID = "123";
    let sent = false;
    globalThis.fetch = async () => { sent = true; throw new Error("should not send"); };
    const { setupNotificationHandler } = await server.ssrLoadModule("/server/setup-notification.ts");
    let status;
    const response = { setHeader() {}, writeHead(code) { status = code; return this; }, end() {} };
    await setupNotificationHandler({ method: "POST", headers: { host: "localhost:5173", origin: "http://localhost:5173", "content-type": "application/json" }, socket: { remoteAddress: "availability-test" }, body: {} }, response, {
      unavailable: "Unavailable", prepare: () => ({ text: "Test", submittedAt: new Date().toISOString() }),
      beforeDelivery: async () => ({ status: 409, error: "Already exists." }),
    });
    assert.equal(status, 409);
    assert.equal(sent, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (priorToken === undefined) delete process.env.SPOT_TELEGRAM_BOT_TOKEN; else process.env.SPOT_TELEGRAM_BOT_TOKEN = priorToken;
    if (priorChat === undefined) delete process.env.SPOT_TELEGRAM_CHAT_ID; else process.env.SPOT_TELEGRAM_CHAT_ID = priorChat;
    await server.close();
  }
});
