import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { privateKeyToAccount } from "viem/accounts";

test("workspace changes use the authenticated wallet, notify the team, and reject stale or invalid requests", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  const originalFetch = globalThis.fetch, token = process.env.SPOT_TELEGRAM_BOT_TOKEN, chat = process.env.SPOT_TELEGRAM_CHAT_ID;
  try {
    process.env.SPOT_TELEGRAM_BOT_TOKEN = "123:test_token"; process.env.SPOT_TELEGRAM_CHAT_ID = "123";
    const { workspaceEditHandler } = await vite.ssrLoadModule("/server/workspace-edit.ts");
    const owner = privateKeyToAccount(`0x${"1".repeat(64)}`), other = privateKeyToAccount(`0x${"2".repeat(64)}`);
    const id = crypto.randomUUID(), origin = "http://localhost:5173";
    let details = { appName: "Existing App", feesWallet: owner.address, tradingFeeTenthsBps: 10 }, sends = 0, snapshot;
    globalThis.fetch = async (_url, options) => { sends++; const message = JSON.parse(options.body).text; assert.match(message, /Contact: user@example.com/); return Response.json({ ok: true, result: { message_id: 10 } }); };
    const database = { connect: async () => ({ query: async (sql, params = []) => {
      if (sql === "BEGIN") { snapshot = structuredClone(details); return {}; }
      if (sql === "ROLLBACK") { details = snapshot; return {}; }
      if (sql === "COMMIT") return {};
      if (sql.startsWith("SELECT details, product")) return { rows: params[0] === id && params[1].toLowerCase() === owner.address.toLowerCase() ? [{ details, product: "spot", partner_id: "updatedApp" }] : [] };
      if (sql.startsWith("SELECT 1")) return { rowCount: 0 };
      if (sql.startsWith("UPDATE portal_setup_requests")) { details = JSON.parse(params[1]); return { rowCount: 1 }; }
      throw new Error(`Unexpected query: ${sql}`);
    }, release() {} }) };
    const edit = { product: "spot", appName: "Updated App", partnerId: "updatedApp", integrationMode: "existing", url: "https://example.com", wallet: owner.address, fee: 15, contact: "user@example.com" };
    function claim(account, version = 0) { return { address: account.address, requestId: id, version, edit }; }
    async function call(body, authenticate = async request => request.body.address) { let status, payload; const response = { setHeader() {}, writeHead(value) { status = value; return this; }, end(value) { payload = JSON.parse(value); } }; await workspaceEditHandler({ method: "POST", headers: { host: "localhost:5173", origin, "content-type": "application/json" }, socket: { remoteAddress: `edit-test-${crypto.randomUUID()}` }, body }, response, database, authenticate); return { status, payload }; }
    const proof = claim(owner);
    assert.equal((await call(proof, async () => undefined)).status, 401);
    assert.equal((await call({ ...proof, edit: { ...edit, fee: 5000 } })).status, 400);
    assert.equal((await call(claim(other))).status, 409);
    const changed = { ...proof, edit: { ...edit, partnerId: "anotherId" } };
    assert.equal((await call(changed)).status, 400);
    assert.equal((await call(proof)).status, 200);
    assert.equal(details.appName, "Updated App"); assert.equal(details.workspaceVersion, 1); assert.equal(details.feesWallet, owner.address);
    assert.equal(details.dexUrl, "https://example.com"); assert.equal(details.tradingFeeTenthsBps, 15);
    assert.equal("pendingEdit" in details, false); assert.equal("contact" in details, false); assert.equal(sends, 1);
    assert.equal((await call(proof)).status, 409); assert.equal(sends, 1);
    const failed = claim(owner, 1); failed.edit = { ...failed.edit, appName: "Another App" };
    globalThis.fetch = async () => Response.json({ ok: false }, { status: 503 });
    assert.equal((await call(failed)).status, 503);
    assert.equal(details.appName, "Updated App"); assert.equal(details.workspaceVersion, 1);
  } finally { globalThis.fetch = originalFetch; if (token === undefined) delete process.env.SPOT_TELEGRAM_BOT_TOKEN; else process.env.SPOT_TELEGRAM_BOT_TOKEN = token; if (chat === undefined) delete process.env.SPOT_TELEGRAM_CHAT_ID; else process.env.SPOT_TELEGRAM_CHAT_ID = chat; await vite.close(); }
});

test("approval uses the current request version without applying legacy staged changes", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  try {
    const { approveSetupRequest } = await vite.ssrLoadModule("/server/request-repository.ts");
    const wallet = "0x0000000000000000000000000000000000000001";
    const row = { product: "perps", status: "pending", partner_id: "example", details: { appName: "Current App", workspaceVersion: 2, pendingEdit: { appName: "Previous Draft" } } };
    const database = { query: async (sql, params) => {
      if (sql.startsWith("SELECT")) return { rows: [row] };
      assert.doesNotMatch(sql, /pendingEdit/); assert.equal(params[2], "2"); return { rowCount: 1 };
    } };
    assert.equal(await approveSetupRequest(database, "id", wallet, 1), false);
    assert.equal(await approveSetupRequest(database, "id", wallet, 2), true);
    assert.equal(row.details.appName, "Current App"); assert.equal(row.details.pendingEdit.appName, "Previous Draft");
  } finally { await vite.close(); }
});

test("Perps updates preserve approval and historical metadata while replacing workspace fields", async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  const originalFetch = globalThis.fetch, token = process.env.SPOT_TELEGRAM_BOT_TOKEN, chat = process.env.SPOT_TELEGRAM_CHAT_ID;
  try {
    process.env.SPOT_TELEGRAM_BOT_TOKEN = "123:test_token"; process.env.SPOT_TELEGRAM_CHAT_ID = "123";
    const { workspaceEditHandler } = await vite.ssrLoadModule("/server/workspace-edit.ts");
    const owner = privateKeyToAccount(`0x${"3".repeat(64)}`), id = crypto.randomUUID(), origin = "http://localhost:5173";
    const row = { status: "approved", product: "perps", partner_id: "partner", details: { appName: "Original App", appUrl: "https://old.example", appUrlVersion: 4, workspaceVersion: 0, chainIds: [137], retainedProof: "historical" } };
    let delivered;
    globalThis.fetch = async (_url, options) => { delivered = JSON.parse(options.body).text; return Response.json({ ok: true, result: { message_id: 1 } }); };
    const database = { connect: async () => ({ query: async (sql, params = []) => {
      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql)) return {};
      if (sql.startsWith("SELECT details")) return { rows: [row] };
      if (sql.startsWith("UPDATE")) { assert.doesNotMatch(sql, /status\s*=/); row.details = JSON.parse(params[1]); return { rowCount: 1 }; }
      throw new Error(`Unexpected query: ${sql}`);
    }, release() {} }) };
    const edit = { product: "perps", appName: "Updated App", partnerId: "partner", integrationMode: "api", url: "", wallet: owner.address, fee: 25, chainId: 56 };
    const proof = { address: owner.address, requestId: id, version: 0, edit };
    let status; const response = { setHeader() {}, writeHead(value) { status = value; return this; }, end() {} };
    await workspaceEditHandler({ method: "POST", headers: { host: "localhost:5173", origin, "content-type": "application/json" }, socket: { remoteAddress: `perps-${crypto.randomUUID()}` }, body: proof }, response, database, async () => owner.address);
    assert.equal(status, 200); assert.equal(row.status, "approved"); assert.equal(row.details.appName, "Updated App");
    assert.deepEqual(row.details.chainIds, [56]); assert.equal(row.details.builderFeeTenthsBps, 25); assert.equal(row.details.appUrlVersion, 5);
    assert.equal("appUrl" in row.details, false); assert.equal(row.details.retainedProof, "historical");
    assert.match(delivered, /Workspace updated/); assert.match(delivered, /Revenue wallet/);
  } finally { globalThis.fetch = originalFetch; if (token === undefined) delete process.env.SPOT_TELEGRAM_BOT_TOKEN; else process.env.SPOT_TELEGRAM_BOT_TOKEN = token; if (chat === undefined) delete process.env.SPOT_TELEGRAM_CHAT_ID; else process.env.SPOT_TELEGRAM_CHAT_ID = chat; await vite.close(); }
});
