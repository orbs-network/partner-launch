import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("workspace links use the partner ID and product while preserving old UUID links", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "silent" });
  try {
    const { workspaceHref, findWorkspace } = await server.ssrLoadModule("/src/features/pending-requests/workspace-location.ts");
    const spot = { id: "spot-uuid", kind: "spot", appName: "Shared Partner", partnerId: "sharedPartner" };
    const perps = { id: "perps-uuid", kind: "perps", appName: "Shared Partner", partnerId: "sharedPartner" };
    const requests = [spot, perps];
    assert.equal(workspaceHref(spot), "/setups?id=sharedPartner&product=spot");
    assert.equal(workspaceHref(perps), "/setups?id=sharedPartner&product=perps");
    assert.equal(findWorkspace(requests, "SHAREDPARTNER", "perps"), perps);
    assert.equal(findWorkspace(requests, "sharedPartner", "spot"), spot);
    assert.equal(findWorkspace(requests, "perps-uuid", null), perps);
    assert.equal(findWorkspace(requests, "missing", "spot"), undefined);
    assert.equal(workspaceHref({ id: "old", kind: "spot", appName: "Legacy App" }), "/setups?id=legacyApp&product=spot");
  } finally { await server.close(); }
});
