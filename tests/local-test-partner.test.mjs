import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("only the test name on loopback in development skips availability", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "silent" });
  try {
    const { isLocalTestPartner, generateLocalTestPartnerId } = await server.ssrLoadModule("/src/features/onboarding/local-test-partner.ts");
    assert.match(generateLocalTestPartnerId("perps"), /^test-[a-f0-9]{16}$/);
    assert.match(generateLocalTestPartnerId("spot"), /^test[a-f0-9]{16}$/);
    assert.notEqual(generateLocalTestPartnerId("spot"), generateLocalTestPartnerId("spot"));
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) assert.equal(isLocalTestPartner("Test", "development", host), true);
    for (const [name, env, host] of [["test", "production", "localhost"], ["test", "development", "example.com"], ["test-app", "development", "localhost"], [" test", "development", "localhost"]]) assert.equal(isLocalTestPartner(name, env, host), false);
    const { resolveSpotPartnerId } = await server.ssrLoadModule("/server/spot-submit.ts");
    const generated = generateLocalTestPartnerId("spot");
    assert.equal(resolveSpotPartnerId("Test", generated, true), generated);
    assert.throws(() => resolveSpotPartnerId("Test", generated, false), /Invalid local test/);
    assert.throws(() => resolveSpotPartnerId("Other", generated, true), /Invalid local test/);
    assert.equal(resolveSpotPartnerId("Test", undefined, false), "test");
    const { spotAppIdExists } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-app-id-availability.ts");
    const previousWindow = globalThis.window, previousFetch = globalThis.fetch, previousEnv = process.env.NODE_ENV;
    let requests = 0;
    try {
      process.env.NODE_ENV = "development";
      globalThis.window = { location: { hostname: "localhost" } };
      globalThis.fetch = async () => { requests++; return new Response(JSON.stringify({ appId: "other", exists: true }), { status: 200 }); };
      assert.equal(await spotAppIdExists("Test"), false);
      assert.equal(requests, 0);
      assert.equal(await spotAppIdExists("Other"), true);
      assert.equal(requests, 1);
      const { submitSpot } = await server.ssrLoadModule("/src/features/onboarding/spot/submit-spot.ts");
      let submitted;
      globalThis.fetch = async (_url, options) => { submitted = JSON.parse(options.body); return new Response(JSON.stringify({ delivered: true, submittedAt: "2026-11-26T00:00:00.000Z" }), { status: 200 }); };
      const snapshot = await submitSpot({ appName: "Test", localTestPartnerId: generated, feesWallet: "0x0000000000000000000000000000000000000001", contact: "", dexUrl: "", tradingFeePercent: "0", policyAccepted: true, policyVersion: "v", integrationMode: "existing" }, "0x0000000000000000000000000000000000000001", { requestId: "id", accessToken: "token" });
      assert.equal(submitted.localTestPartnerId, generated);
      assert.equal(submitted.appName, "Test");
      assert.equal(snapshot.partnerId, generated);
    } finally {
      if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
      if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
      globalThis.fetch = previousFetch;
    }
  } finally { await server.close(); }
});
