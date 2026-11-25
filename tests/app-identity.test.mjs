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
    assert.equal(prepareSpotSetup({ ...emptySpotDraft(), integrationMode: "existing", appName: "1inch", feesWallet: wallet, policyAccepted: true }).appName, "1inch");
    const request = preparePerpsRequest({ appName: "1inch", partnerId: generateAccountId("1inch"), ownerWallet: wallet,
      revenueWallet: wallet, chainIds: [137], builderFeeTenthsBps: 0, launchPath: "creator", policyAccepted: true, policyVersion: TERMS_VERSION });
    assert.equal(request.partnerId, "1inch");
  } finally {
    await server.close();
  }
});

test("Spot trading fees validate exact 0–1% values and preserve older drafts", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { parseSpotFeePercent, formatSpotFeePercent } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-fee.ts");
    const { emptySpotDraft, restoreSpotDraft, prepareSpotSetup } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-setup.ts");
    for (const [input, value] of [["0", 0], ["0.001", 1], ["0.5", 500], ["1", 1000]]) {
      assert.equal(parseSpotFeePercent(input), value);
      assert.equal(parseSpotFeePercent(formatSpotFeePercent(value)), value);
    }
    for (const input of ["", "-0.1", "1.001", "0.0001", "1e-3"]) assert.equal(parseSpotFeePercent(input), null);
    assert.equal(restoreSpotDraft({}).tradingFeePercent, "0");
    const draft = { ...emptySpotDraft(), integrationMode: "existing", appName: "Example", feesWallet: "0x0000000000000000000000000000000000000001", policyAccepted: true, tradingFeePercent: "1" };
    assert.equal(prepareSpotSetup(draft).tradingFeeTenthsBps, 1000);
    assert.throws(() => prepareSpotSetup({ ...draft, tradingFeePercent: "1.001" }), /platform fee/);
  } finally { await server.close(); }
});

test("Perps integration choice persists without changing the app identity or signed setup", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { initialDraft } = await server.ssrLoadModule("/src/features/onboarding/state/draft.ts");
    const { sanitizeDraft, selectDraft } = await server.ssrLoadModule("/src/features/onboarding/state/hydration.ts");
    const { INTEGRATION_CHOICE_STEP, PARTNER_STEP, onboardingStepOrder } = await server.ssrLoadModule("/src/features/onboarding/onboarding-steps.ts");
    const { getStepError } = await server.ssrLoadModule("/src/features/onboarding/validation.ts");
    const { setupHash } = await server.ssrLoadModule("/src/features/onboarding/setup-submission.ts");
    const { preparePerpsRequest } = await server.ssrLoadModule("/src/features/onboarding/perps-request.ts");
    const { TERMS_VERSION } = await server.ssrLoadModule("/src/features/onboarding/terms-policy.ts");
    const draft = { ...initialDraft, launchPath: "creator", step: INTEGRATION_CHOICE_STEP };
    assert.ok(onboardingStepOrder.indexOf(INTEGRATION_CHOICE_STEP) < onboardingStepOrder.indexOf(PARTNER_STEP));
    assert.match(getStepError(INTEGRATION_CHOICE_STEP, draft), /Choose/);
    assert.equal(getStepError(INTEGRATION_CHOICE_STEP, { ...draft, integrationMode: "api" }), undefined);
    assert.equal(sanitizeDraft(selectDraft({ ...draft, integrationMode: "api" })).integrationMode, "api");
    assert.equal(setupHash({ ...draft, integrationMode: "api" }), setupHash({ ...draft, integrationMode: "ui" }));
    const wallet = "0x0000000000000000000000000000000000000001";
    const body = { appName: "Example", partnerId: "example", ownerWallet: wallet, revenueWallet: wallet, chainIds: [137], builderFeeTenthsBps: 0, launchPath: "creator", integrationMode: "api", policyAccepted: true, policyVersion: TERMS_VERSION };
    assert.equal(preparePerpsRequest(body).integrationMode, "api");
    assert.throws(() => preparePerpsRequest({ ...body, integrationMode: "invalid" }));
    assert.equal(preparePerpsRequest({ ...body, integrationMode: undefined }).integrationMode, undefined);
  } finally { await server.close(); }
});

test("Spot deposit step follows review and restores only with accepted policy", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { spotSteps, emptySpotDraft, restoreSpotDraft, prepareSpotSetup } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-setup.ts");
    assert.deepEqual(spotSteps.map(step => step.id), ["integration", "app", "wallet", "build", "url", "review", "deposit"]);
    const draft = { ...emptySpotDraft(), integrationMode: "existing", step: "deposit", appName: "Example", feesWallet: "0x0000000000000000000000000000000000000001", policyAccepted: true };
    assert.equal(restoreSpotDraft(draft).step, "deposit");
    assert.equal(restoreSpotDraft({ ...draft, policyAccepted: false }).step, "review");
    const setup = prepareSpotSetup(draft);
    assert.equal("paymentStatus" in setup, false);
    assert.equal("depositReceipt" in setup, false);
  } finally { await server.close(); }
});

test("optional Perps app URL survives drafts and does not rewrite signed data", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { initialDraft } = await server.ssrLoadModule("/src/features/onboarding/state/draft.ts");
    const { sanitizeDraft, selectDraft } = await server.ssrLoadModule("/src/features/onboarding/state/hydration.ts");
    const { APP_URL_STEP, PARTNER_STEP, NETWORKS_STEP, onboardingStepOrder } = await server.ssrLoadModule("/src/features/onboarding/onboarding-steps.ts");
    const { getStepError } = await server.ssrLoadModule("/src/features/onboarding/validation.ts");
    const { setupHash } = await server.ssrLoadModule("/src/features/onboarding/setup-submission.ts");
    const { preparePerpsRequest } = await server.ssrLoadModule("/src/features/onboarding/perps-request.ts");
    const { TERMS_VERSION } = await server.ssrLoadModule("/src/features/onboarding/terms-policy.ts");
    assert.ok(onboardingStepOrder.indexOf(PARTNER_STEP) < onboardingStepOrder.indexOf(APP_URL_STEP));
    assert.ok(onboardingStepOrder.indexOf(NETWORKS_STEP) < onboardingStepOrder.indexOf(APP_URL_STEP));
    const draft = { ...initialDraft, appUrl: "https://example.org" };
    assert.equal(getStepError(APP_URL_STEP, { ...draft, appUrl: "" }), undefined);
    assert.ok(getStepError(APP_URL_STEP, { ...draft, appUrl: "javascript:alert(1)" }));
    assert.equal(sanitizeDraft(selectDraft(draft)).appUrl, draft.appUrl);
    assert.equal(setupHash(draft), setupHash({ ...draft, appUrl: "https://other.example" }));
    const wallet = "0x0000000000000000000000000000000000000001";
    const body = { appName: "Example", partnerId: "example", ownerWallet: wallet, revenueWallet: wallet, chainIds: [137], builderFeeTenthsBps: 0, launchPath: "creator", policyAccepted: true, policyVersion: TERMS_VERSION };
    assert.equal(preparePerpsRequest({ ...body, appUrl: "https://example.org" }).appUrl, "https://example.org");
    assert.equal(preparePerpsRequest(body).appUrl, undefined);
    assert.throws(() => preparePerpsRequest({ ...body, appUrl: "https://user:password@example.org" }));
  } finally { await server.close(); }
});

test("Spot integration choice preserves drafts and selects the correct agent instructions", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { emptySpotDraft, restoreSpotDraft, spotStepError, prepareSpotSetup } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-setup.ts");
    const { createSpotIntegrationPrompt } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-integration-prompt.ts");
    const wallet = "0x0000000000000000000000000000000000000001";
    const draft = { ...emptySpotDraft(), appName: "Example App", feesWallet: wallet, policyAccepted: true };
    assert.equal(draft.step, "integration");
    assert.match(spotStepError("integration", draft), /Choose/);
    assert.equal(restoreSpotDraft({ step: "app", appName: "Example App" }).integrationMode, "existing");
    assert.equal(restoreSpotDraft({ ...draft, integrationMode: "ui" }).integrationMode, "ui");
    const setup = prepareSpotSetup({ ...draft, integrationMode: "ui" });
    assert.equal(setup.integrationMode, "ui");
    const ui = createSpotIntegrationPrompt({ ...setup, partnerId: "examplePartner" });
    assert.match(ui, /orbs-network\/orbs-spot/);
    assert.match(ui, /spot-partner-setup\/SKILL\.md/);
    assert.match(ui, /https:\/\/swap\.orbs\.network\/orders/);
    assert.match(ui, /Do not use the Orbs APP_ID/);
    assert.match(ui, /matching desktop and mobile viewports/);
    assert.match(ui, /do not redesign or replace/i);
    assert.match(ui, /NEXT_PARTNER/);
    assert.match(ui, /do not ask me to provide it again/);
    assert.match(ui, /You may ask which chains/);
    assert.match(ui, /does not prove activation/);
    assert.match(ui, /preview for design approval/);
    assert.match(createSpotIntegrationPrompt(setup, { chooseBranding: true }), /without asking for another design approval/);
    assert.match(ui, /examplePartner/);
    assert.doesNotMatch(ui, /spot-swap-integration/);
    const existing = createSpotIntegrationPrompt({ ...setup, integrationMode: "existing" });
    assert.match(existing, /spot-swap-integration/);
    assert.doesNotMatch(existing, /orbs-network\/orbs-spot/);
    assert.equal(createSpotIntegrationPrompt({ ...setup, integrationMode: undefined }), existing);
  } finally { await server.close(); }
});

test("Spot UI build precedes optional DEX URL and both paths preserve it", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { emptySpotDraft, spotStepsForMode, restoreSpotDraft, prepareSpotSetup } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-setup.ts");
    assert.deepEqual(spotStepsForMode("ui").map(step => step.id), ["integration", "app", "wallet", "build", "url", "review", "deposit"]);
    assert.deepEqual(spotStepsForMode("existing").map(step => step.id), ["integration", "app", "wallet", "url", "review", "deposit"]);
    const draft = { ...emptySpotDraft(), integrationMode: "ui", step: "url", appName: "Example App", dexUrl: "https://example.org", feesWallet: "0x0000000000000000000000000000000000000001", policyAccepted: true };
    const restored = restoreSpotDraft(draft);
    assert.equal(restored.step, "url"); assert.equal(restored.dexUrl, draft.dexUrl);
    assert.equal(prepareSpotSetup(draft).dexUrl, draft.dexUrl);
    assert.equal(prepareSpotSetup({ ...draft, integrationMode: "existing" }).dexUrl, draft.dexUrl);
    for (const integrationMode of ["ui", "existing"]) assert.throws(() => prepareSpotSetup({ ...draft, integrationMode, dexUrl: "invalid previous URL" }), /valid DEX URL/);
  } finally { await server.close(); }
});

test("Perps UI build precedes its URL and review while API skips the build step", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "silent" });
  try {
    const { INTEGRATION_CHOICE_STEP, PARTNER_STEP, NETWORKS_STEP, REVENUE_STEP, BUILD_UI_STEP, APP_URL_STEP, TERMS_STEP, FUNDING_STEP } = await server.ssrLoadModule("/src/features/onboarding/onboarding-steps.ts");
    const { launchStepOrder, nextLaunchStep, previousLaunchStep } = await server.ssrLoadModule("/src/features/onboarding/launch-flow.ts");
    const { restoreStep, getStepId } = await server.ssrLoadModule("/src/features/onboarding/state/step-position.ts");
    const ui = launchStepOrder("ui");
    assert.deepEqual(ui.slice(1), [INTEGRATION_CHOICE_STEP, PARTNER_STEP, NETWORKS_STEP, REVENUE_STEP, BUILD_UI_STEP, APP_URL_STEP, TERMS_STEP, FUNDING_STEP]);
    assert.equal(nextLaunchStep(REVENUE_STEP, "ui"), BUILD_UI_STEP);
    assert.equal(nextLaunchStep(BUILD_UI_STEP, "ui"), APP_URL_STEP);
    assert.equal(nextLaunchStep(REVENUE_STEP, "api"), APP_URL_STEP);
    assert.equal(previousLaunchStep(APP_URL_STEP, "api"), REVENUE_STEP);
    assert.equal(launchStepOrder("api").includes(BUILD_UI_STEP), false);
    assert.equal(restoreStep({ stepId: "app-url" }), APP_URL_STEP);
    assert.equal(restoreStep({ stepId: "build-ui" }), BUILD_UI_STEP);
    assert.equal(getStepId(BUILD_UI_STEP), "build-ui");
  } finally { await server.close(); }
});
