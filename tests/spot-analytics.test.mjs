import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const adapter = "0x1111111111111111111111111111111111111111";
const older = "0x2222222222222222222222222222222222222222";
const chain = 137;
const recent = new Date().toISOString();
const entry = (hash, id, status = "completed") => ({ hash, timestamp: recent, exchangeAdapter: adapter,
  order: { witness: { chainId: id } }, metadata: { status }, totalUSDAmount: "15.25" });

test("Spot analytics scopes current and old adapters, merges both services, and deduplicates by chain and hash", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  const originalFetch = globalThis.fetch;
  try {
    const { fetchSpotAnalytics, SpotAnalyticsError } = await vite.ssrLoadModule("/src/features/spot-analytics/api.ts");
    const controller = new AbortController();
    globalThis.fetch = async (input, options) => {
      assert.equal(options.signal, controller.signal);
      const url = new URL(input);
      if (url.hostname === "raw.githubusercontent.com") return Response.json({ "*": {}, "137": { dex: { testApp: { adapter } } } });
      if (url.pathname === "/status") return Response.json({ chains: [{ chainId: chain, exchanges: [{ name: "testApp-old-1", address: older }] }] });
      assert.equal(url.pathname, "/orders");
      assert.equal(url.searchParams.get("view"), "list");
      assert.equal(url.searchParams.get("limit"), "100");
      assert.equal(url.searchParams.get("page"), "1");
      if (url.searchParams.get("exchange") === older) return Response.json({ orders: [] });
      return Response.json({ orders: url.hostname.includes("-v2") ? [entry("one", 137), entry("not-mapped", 1)] : [entry("one", 137, "failed"), entry("two", 137)] });
    };
    const data = await fetchSpotAnalytics("testApp", 30, controller.signal);
    assert.equal(data.orders.length, 2);
    assert.equal(data.orders.find(order => order.hash === "one").status, "completed");
    assert.equal(data.orders[0].orderValueUsd, 15.25);
    await assert.rejects(fetchSpotAnalytics("testApp,other", 30, controller.signal), SpotAnalyticsError);
    globalThis.fetch = async () => Response.json({ error: "unavailable" }, { status: 500 });
    await assert.rejects(fetchSpotAnalytics("testApp", 30, controller.signal), /unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
    await vite.close();
  }
});

test("Spot status breakdown matches terminal and open outcomes without losing orders", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  try {
    const { spotOrderStatus, countSpotStatuses } = await vite.ssrLoadModule("/src/features/spot-analytics/order-status.ts");
    assert.equal(spotOrderStatus({ status: "eligible", displayStatus: "ERROR" }), "open");
    assert.equal(spotOrderStatus({ status: "pending", displayStatus: "CANCELLED" }), "cancelled");
    assert.equal(spotOrderStatus({ status: "other", displayStatus: "SUCCEEDED" }), "completed");
    const orders = ["pending", "eligible", "completed", "partially_completed", "cancelled", "expired", "failed", "unexpected"].map(status => ({ status }));
    const counts = countSpotStatuses(orders);
    assert.deepEqual(counts, { open: 2, completed: 1, partial: 1, cancelled: 1, expired: 1, failed: 1, other: 1 });
    assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), orders.length);
  } finally { await vite.close(); }
});
