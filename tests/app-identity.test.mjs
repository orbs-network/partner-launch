import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("display names support brands while IDs remain safe and compatible", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { validateDexName, generateAccountId } = await server.ssrLoadModule("/src/features/onboarding/dex-identity.ts");
    const { generateSpotAppId } = await server.ssrLoadModule("/src/features/onboarding/spot/app-id.ts");
    const { emptySpotDraft, prepareSpotSetup } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-setup.ts");
    const { preparePerpsRequest } = await server.ssrLoadModule("/src/features/onboarding/perps-request.ts");
    const { TERMS_VERSION } = await server.ssrLoadModule("/src/features/onboarding/terms-policy.ts");

    for (const name of ["1inch", "dYdX 2.0", "Bob's DEX", "Denis test app"]) assert.equal(validateDexName(name), undefined);
    assert.ok(validateDexName("Bad\nName"));
    assert.equal(generateSpotAppId("Denis test app"), "denisTestApp");
    assert.equal(generateSpotAppId("dYdX 2.0"), "dydx20");

    const wallet = "0x0000000000000000000000000000000000000001";
    assert.equal(prepareSpotSetup({ ...emptySpotDraft(), appName: "1inch", feesWallet: wallet, policyAccepted: true }).appName, "1inch");
    const request = preparePerpsRequest({ appName: "1inch", partnerId: generateAccountId("1inch"), ownerWallet: wallet,
      revenueWallet: wallet, chainIds: [137], builderFeeTenthsBps: 0, launchPath: "creator", policyAccepted: true, policyVersion: TERMS_VERSION });
    assert.equal(request.partnerId, "1inch");
  } finally {
    await server.close();
  }
});
