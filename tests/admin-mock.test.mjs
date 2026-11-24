import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("mock approvals preserve requests and reject stale or corrupt data", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const values = new Map();
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try {
    const { approveLocally, MOCK_APPROVALS_KEY, readMockApprovals } = await server.ssrLoadModule("/src/features/pending-requests/mock-approvals.ts");
    const { PENDING_REQUESTS_KEY } = await server.ssrLoadModule("/src/features/pending-requests/store.ts");
    const request = { id: "spot:test", kind: "spot", status: "pending", appName: "Test DEX", savedAt: "2026-01-01T00:00:00.000Z", feesWallet: "0x0000000000000000000000000000000000000001", notification: "telegram" };
    const original = JSON.stringify({ version: 1, requests: [request] });
    values.set(PENDING_REQUESTS_KEY, original);
    assert.equal(approveLocally(request).length, 1);
    assert.equal(approveLocally(request).length, 1);
    assert.equal(values.get(PENDING_REQUESTS_KEY), original);
    assert.equal(readMockApprovals(values.get(MOCK_APPROVALS_KEY))[0].request.appName, "Test DEX");
    values.set(PENDING_REQUESTS_KEY, JSON.stringify({ version: 1, requests: [{ ...request, appName: "Changed DEX" }] }));
    assert.throws(() => approveLocally(request), /changed/i);
    values.set(PENDING_REQUESTS_KEY, original);
    values.set(MOCK_APPROVALS_KEY, "not-json");
    assert.throws(() => approveLocally(request));
    assert.equal(values.get(MOCK_APPROVALS_KEY), "not-json");
  } finally {
    globalThis.localStorage = previousStorage;
    await server.close();
  }
});
