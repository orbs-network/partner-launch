import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { newDb, DataType } from "pg-mem";
import { privateKeyToAccount } from "viem/accounts";

test("owner wallets validate, retain partial drafts, and reject duplicate addresses", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { validateOwnerWallets, normalizeOwnerWallets, restoreOwnerWallets } = await server.ssrLoadModule("/src/features/onboarding/owner-wallets.ts");
    const address = "0x00000000000000000000000000000000000000ab";
    assert.equal(validateOwnerWallets([]), undefined);
    assert.ok(validateOwnerWallets([""]));
    assert.ok(validateOwnerWallets(["0x0000000000000000000000000000000000000000"]));
    assert.ok(validateOwnerWallets([address, address.toUpperCase().replace("0X", "0x")]));
    assert.equal(validateOwnerWallets([address]), undefined);
    assert.deepEqual(normalizeOwnerWallets([` ${address} `]), [address]);
    assert.deepEqual(restoreOwnerWallets(["0x12"]), ["0x12"]);
  } finally { await server.close(); }
});

test("hidden owner wallets in an older Spot draft do not block or accompany a new submission", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const originalFetch = globalThis.fetch;
  try {
    const { emptySpotDraft, restoreSpotDraft, spotStepError } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-setup.ts");
    const { submitSpot } = await server.ssrLoadModule("/src/features/onboarding/spot/submit-spot.ts");
    const draft = restoreSpotDraft({ ...emptySpotDraft(), appName: "Sample Dex", ownerWallets: ["partially entered"] });
    assert.equal(spotStepError("app", draft), undefined);
    let body;
    globalThis.fetch = async (_url, options) => { body = JSON.parse(options.body); return { ok: true, json: async () => ({ delivered: true, submittedAt: new Date().toISOString() }) }; };
    await submitSpot(draft, "0x0000000000000000000000000000000000000001", { requestId: crypto.randomUUID(), accessToken: "a".repeat(64) });
    assert.equal("ownerWallets" in body, false);
  } finally { globalThis.fetch = originalFetch; await server.close(); }
});

test("Spot App ID checks and submission report an existing ID", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const originalFetch = globalThis.fetch;
  try {
    const { spotAppIdExists } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-app-id-availability.ts");
    const { submitSpot, SpotAppIdTakenError } = await server.ssrLoadModule("/src/features/onboarding/spot/submit-spot.ts");
    const { emptySpotDraft } = await server.ssrLoadModule("/src/features/onboarding/spot/spot-setup.ts");
    globalThis.fetch = async () => new Response(JSON.stringify({ appId: "sampleDex", exists: true }), { status: 200 });
    assert.equal(await spotAppIdExists("Sample Dex"), true);
    globalThis.fetch = async () => new Response(JSON.stringify({ appId: "different", exists: false }), { status: 200 });
    await assert.rejects(spotAppIdExists("Sample Dex"));
    globalThis.fetch = async () => new Response(JSON.stringify({ code: "spot_app_id_taken", error: "Already exists" }), { status: 409 });
    await assert.rejects(submitSpot({ ...emptySpotDraft(), appName: "Sample Dex" }, "0x0000000000000000000000000000000000000001", { requestId: crypto.randomUUID(), accessToken: "a".repeat(64) }), SpotAppIdTakenError);
  } finally { globalThis.fetch = originalFetch; await server.close(); }
});

test("duplicate Partner ID database conflicts are reported for both products", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const oldToken = process.env.SPOT_TELEGRAM_BOT_TOKEN, oldChat = process.env.SPOT_TELEGRAM_CHAT_ID;
  try {
    process.env.SPOT_TELEGRAM_BOT_TOKEN = "123:test_token"; process.env.SPOT_TELEGRAM_CHAT_ID = "123";
    const { setupNotificationHandler } = await server.ssrLoadModule("/server/setup-notification.ts");
    let status, payload, calls = 0;
    const response = { setHeader() {}, writeHead(code) { status = code; return this; }, end(value) { payload = JSON.parse(value); } };
    const database = { connect: async () => ({ query: async sql => { if (sql === "BEGIN" || sql === "ROLLBACK") return {}; calls++; throw Object.assign(new Error("duplicate"), { code: "23505", constraint: "portal_partner_id_unique" }); }, release() {} }) };
    for (const product of ["spot", "perps"]) {
      const record = { id: crypto.randomUUID(), product, partnerId: "sampleDex", accessToken: "a".repeat(64), details: { appName: "Sample Dex" } };
      await setupNotificationHandler({ method: "POST", headers: { host: "localhost:5173", origin: "http://localhost:5173", "content-type": "application/json" }, socket: { remoteAddress: "duplicate-test" }, body: {} }, response,
        { unavailable: "Unavailable", database, prepare: () => ({ text: "Test", submittedAt: new Date().toISOString(), record }) });
      assert.equal(status, 409);
      assert.equal(payload.code, product === "spot" ? "spot_app_id_taken" : "partner_id_taken");
    }
    assert.equal(calls, 2);
  } finally {
    if (oldToken === undefined) delete process.env.SPOT_TELEGRAM_BOT_TOKEN; else process.env.SPOT_TELEGRAM_BOT_TOKEN = oldToken;
    if (oldChat === undefined) delete process.env.SPOT_TELEGRAM_CHAT_ID; else process.env.SPOT_TELEGRAM_CHAT_ID = oldChat;
    await server.close();
  }
});

test("admin wallet proof is bound to allowlist, origin, and time", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const prior = process.env.PORTAL_ADMIN_WALLETS;
  try {
    const { adminSignInMessage, verifyAdminProof } = await server.ssrLoadModule("/server/admin-session.ts");
    const account = privateKeyToAccount(`0x${"1".repeat(64)}`);
    process.env.PORTAL_ADMIN_WALLETS = account.address;
    const base = { address: account.address, origin: "http://localhost:5173", issuedAt: new Date().toISOString(), nonce: crypto.randomUUID() };
    const proof = { ...base, signature: await account.signMessage({ message: adminSignInMessage(base) }) };
    const request = { headers: { host: "localhost:5173", origin: base.origin }, socket: {} };
    assert.equal(await verifyAdminProof(proof, request), account.address);
    assert.equal(await verifyAdminProof(proof, { ...request, headers: { ...request.headers, origin: "https://other.example" } }), undefined);
    assert.equal(await verifyAdminProof(proof, request, Date.now() + 6 * 60_000), undefined);
    process.env.PORTAL_ADMIN_WALLETS = "0x0000000000000000000000000000000000000001";
    assert.equal(await verifyAdminProof(proof, request), undefined);
  } finally {
    if (prior === undefined) delete process.env.PORTAL_ADMIN_WALLETS; else process.env.PORTAL_ADMIN_WALLETS = prior;
    await server.close();
  }
});

test("admin requests need a signed proof once, then use the session cookie", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const prior = process.env.PORTAL_ADMIN_WALLETS;
  try {
    const { adminRequestsHandler } = await server.ssrLoadModule("/server/admin-requests.ts");
    const { adminSignInMessage } = await server.ssrLoadModule("/server/admin-session.ts");
    const account = privateKeyToAccount(`0x${"2".repeat(64)}`);
    process.env.PORTAL_ADMIN_WALLETS = account.address;
    const sessions = new Map(), usedNonces = new Set();
    const database = { query: async (sql, values = []) => {
      if (sql.startsWith("SELECT wallet_address FROM portal_sessions")) {
        const row = sessions.get(values[0]);
        return { rows: row && row.kind === values[1] && row.expires > Date.now() ? [{ wallet_address: row.wallet }] : [], rowCount: row ? 1 : 0 };
      }
      if (sql.startsWith("DELETE")) return { rows: [], rowCount: 0 };
      if (sql.startsWith("INSERT INTO portal_used_proofs")) {
        if (usedNonces.has(values[0])) return { rows: [], rowCount: 0 };
        usedNonces.add(values[0]); return { rows: [{ nonce: values[0] }], rowCount: 1 };
      }
      if (sql.startsWith("INSERT INTO portal_sessions")) {
        sessions.set(values[0], { wallet: values[1], kind: values[2], expires: values[3].getTime() }); return { rows: [], rowCount: 1 };
      }
      return sql.startsWith("SELECT") ? { rows: [], rowCount: 0 } : { rows: [{ id: "test" }], rowCount: 1 };
    } };
    async function call(body, { origin = "http://localhost:5173", cookie } = {}) {
      let status, payload, setCookie;
      const response = { setHeader(name, value) { if (name === "Set-Cookie") setCookie = value; }, getHeader() {},
        writeHead(code) { status = code; return this; }, end(value) { payload = JSON.parse(value); } };
      await adminRequestsHandler({ method: "POST", socket: {}, headers: { host: "localhost:5173", origin, "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body }, response, database);
      return { status, payload, cookie: setCookie?.[0]?.split(";")[0] };
    }
    const base = { address: account.address, origin: "http://localhost:5173", issuedAt: new Date().toISOString(), nonce: crypto.randomUUID() };
    const proof = { ...base, signature: await account.signMessage({ message: adminSignInMessage(base) }) };
    // The connected address alone is only a claim.
    assert.equal((await call({ address: account.address, action: "list" })).status, 401);
    const signedIn = await call({ address: account.address, action: "list", proof });
    assert.equal(signedIn.status, 200);
    assert.match(signedIn.cookie, /^portal_admin_session=[a-f\d]{64}$/);
    assert.equal((await call({ address: account.address, action: "approve", requestId: crypto.randomUUID() }, { cookie: signedIn.cookie })).status, 200);
    // A proof is accepted once; a replay without the cookie is refused.
    assert.equal((await call({ address: account.address, action: "list", proof })).status, 401);
    // Removing the wallet from the allowlist ends its session.
    process.env.PORTAL_ADMIN_WALLETS = "0x0000000000000000000000000000000000000001";
    assert.equal((await call({ address: account.address, action: "list" }, { cookie: signedIn.cookie })).status, 401);
    process.env.PORTAL_ADMIN_WALLETS = account.address;
    assert.equal((await call({ address: account.address, action: "list" }, { origin: "https://other.example", cookie: signedIn.cookie })).status, 403);
  } finally {
    if (prior === undefined) delete process.env.PORTAL_ADMIN_WALLETS; else process.env.PORTAL_ADMIN_WALLETS = prior;
    await server.close();
  }
});

test("cancellation signature is scoped to the request, wallet, origin and time", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  try {
    const { spotCancelMessage } = await server.ssrLoadModule("/src/features/pending-requests/spot-cancel-proof.ts");
    const { verifySpotCancelProof } = await server.ssrLoadModule("/server/spot-cancel-proof.ts");
    const account = privateKeyToAccount(`0x${"1".repeat(64)}`);
    const details = { address: account.address, origin: "http://localhost:5173", issuedAt: new Date().toISOString(), nonce: crypto.randomUUID(), requestId: crypto.randomUUID() };
    const proof = { ...details, signature: await account.signMessage({ message: spotCancelMessage(details) }) };
    const request = { headers: { host: "localhost:5173", origin: details.origin }, socket: {} };
    assert.equal(await verifySpotCancelProof(proof, request, details.requestId), account.address);
    assert.equal(await verifySpotCancelProof(proof, request, crypto.randomUUID()), undefined);
    assert.equal(await verifySpotCancelProof(proof, { ...request, headers: { ...request.headers, origin: "https://other.example" } }, details.requestId), undefined);
    assert.equal(await verifySpotCancelProof({ ...proof, issuedAt: new Date(Date.now() - 10 * 60_000).toISOString() }, request, details.requestId), undefined);
  } finally { await server.close(); }
});

test("request repository protects status and requires delivery before approval", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const memory = newDb();
  memory.public.registerFunction({ name: "length", args: [DataType.text], returns: DataType.integer, implementation: value => value.length });
  memory.public.registerFunction({ name: "jsonb_typeof", args: [DataType.jsonb], returns: DataType.text, implementation: value => Array.isArray(value) ? "array" : typeof value });
  const { Pool } = memory.adapters.createPg();
  const database = new Pool();
  try {
    memory.public.none(await readFile("migrations/001_setup_requests.sql", "utf8"));
    memory.public.none(await readFile("migrations/002_request_wallet.sql", "utf8"));
    memory.public.none(await readFile("migrations/003_request_owners.sql", "utf8"));
    memory.public.none("ALTER TABLE portal_setup_requests ADD COLUMN partner_id text");
    memory.public.none("CREATE UNIQUE INDEX portal_partner_id_unique ON portal_setup_requests (lower(partner_id))");
    const { saveSetupRequest, partnerIdExists, markRequestDelivered, getRequestStatus, approveSetupRequest, listWalletRequests } = await server.ssrLoadModule("/server/request-repository.ts");
    const { lockOwnedSpotRequest, cancelOwnedSpotRequest } = await server.ssrLoadModule("/server/spot-owner-authorization.ts");
    const { walletRequestsHandler } = await server.ssrLoadModule("/server/wallet-requests.ts");
    const id = crypto.randomUUID(), token = "a".repeat(64), admin = "0x0000000000000000000000000000000000000001";
    const coOwner = "0x0000000000000000000000000000000000000003";
    const request = { id, accessToken: token, product: "spot", partnerId: "sampleDex", ownerWallet: admin, ownerWallets: [coOwner], details: { appName: "Sample Dex", feesWallet: admin, ownerWallets: [coOwner], contact: "private@example.com" } };
    await saveSetupRequest(database, request);
    assert.equal(await partnerIdExists(database, "SAMPLEDEX"), true);
    await assert.rejects(saveSetupRequest(database, { id: crypto.randomUUID(), accessToken: token, product: "perps", partnerId: "SAMPLEDEX", details: {} }));
    await assert.rejects(saveSetupRequest(database, { ...request, ownerWallets: ["0x0000000000000000000000000000000000000004"] }));
    assert.equal(await getRequestStatus(database, id, token), undefined);
    assert.equal(await approveSetupRequest(database, id, admin), false);
    await markRequestDelivered(database, id, token);
    assert.equal((await listWalletRequests(database, "0x0000000000000000000000000000000000000002")).length, 0);
    const visible = await listWalletRequests(database, admin);
    assert.equal(visible.length, 1);
    assert.equal((await listWalletRequests(database, coOwner)).length, 0);
    const teammateId = crypto.randomUUID();
    await saveSetupRequest(database, { id: teammateId, accessToken: token, product: "spot", partnerId: "teammateDex", ownerWallet: coOwner,
      ownerWallets: [admin], details: { appName: "Teammate Dex", feesWallet: admin, ownerWallets: [admin] } });
    await markRequestDelivered(database, teammateId, token);
    assert.deepEqual((await listWalletRequests(database, admin)).map(row => row.id), [id]);
    assert.deepEqual((await listWalletRequests(database, coOwner)).map(row => row.id), [teammateId]);
    async function queryAddress(address) {
      let status, body;
      const response = { setHeader() {}, writeHead(code) { status = code; return this; }, end(value) { body = JSON.parse(value); } };
      await walletRequestsHandler({ method: "POST", headers: { "content-type": "application/json" }, body: { address } }, response, database);
      return { status, body };
    }
    assert.deepEqual((await queryAddress(admin)).body.requests.map(row => row.id), [id]);
    assert.deepEqual((await queryAddress(coOwner)).body.requests.map(row => row.id), [teammateId]);
    assert.equal((await queryAddress("not an address")).status, 400);
    const client = await database.connect();
    try {
      assert.equal(await lockOwnedSpotRequest(client, id, coOwner), undefined);
      assert.equal(await cancelOwnedSpotRequest(client, id, coOwner), false);
      assert.equal(await lockOwnedSpotRequest(client, id, admin) !== undefined, true);
    } finally { client.release(); }
    assert.equal(visible[0].appName, "Sample Dex");
    assert.equal(visible[0].partnerId, "sampleDex");
    const storedSpot = await database.query("SELECT partner_id FROM portal_setup_requests WHERE id = $1", [id]);
    assert.equal(storedSpot.rows[0].partner_id, "sampleDex");
    const perpsId = crypto.randomUUID();
    await saveSetupRequest(database, { id: perpsId, accessToken: token, product: "perps", partnerId: "perpsPartner", details: { partnerId: "perpsPartner" } });
    const storedPerps = await database.query("SELECT partner_id FROM portal_setup_requests WHERE id = $1", [perpsId]);
    assert.equal(storedPerps.rows[0].partner_id, "perpsPartner");
    assert.equal("contact" in visible[0], false);
    assert.equal(await getRequestStatus(database, id, "b".repeat(64)), undefined);
    assert.equal(await getRequestStatus(database, id, token), "pending");
    assert.equal(await approveSetupRequest(database, id, admin), true);
    assert.equal(await getRequestStatus(database, id, token), "approved");
    assert.equal(await approveSetupRequest(database, id, admin), false);
  } finally { await database.end(); await server.close(); }
});

test("submission saves a delivered wallet request and retries do not resend", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  const memory = newDb();
  memory.public.registerFunction({ name: "length", args: [DataType.text], returns: DataType.integer, implementation: value => value.length });
  memory.public.registerFunction({ name: "jsonb_typeof", args: [DataType.jsonb], returns: DataType.text, implementation: value => Array.isArray(value) ? "array" : typeof value });
  const { Pool } = memory.adapters.createPg();
  const database = new Pool();
  const originalFetch = globalThis.fetch, oldToken = process.env.SPOT_TELEGRAM_BOT_TOKEN, oldChat = process.env.SPOT_TELEGRAM_CHAT_ID;
  try {
    memory.public.none(await readFile("migrations/001_setup_requests.sql", "utf8"));
    memory.public.none(await readFile("migrations/002_request_wallet.sql", "utf8"));
    memory.public.none(await readFile("migrations/003_request_owners.sql", "utf8"));
    memory.public.none("ALTER TABLE portal_setup_requests ADD COLUMN partner_id text");
    process.env.SPOT_TELEGRAM_BOT_TOKEN = "123:test_token"; process.env.SPOT_TELEGRAM_CHAT_ID = "123";
    let deliveries = 0;
    globalThis.fetch = async () => { deliveries++; return { ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) }; };
    const { setupNotificationHandler } = await server.ssrLoadModule("/server/setup-notification.ts");
    const { listWalletRequests } = await server.ssrLoadModule("/server/request-repository.ts");
    const owner = "0x0000000000000000000000000000000000000001";
    const record = { id: crypto.randomUUID(), product: "spot", partnerId: "example", accessToken: "a".repeat(64), ownerWallet: owner,
      details: { appName: "Example", feesWallet: owner } };
    const options = { database, unavailable: "Unavailable", prepare: () => ({ text: "Test", submittedAt: new Date().toISOString(), record }) };
    async function submit() {
      let status, body;
      const response = { setHeader() {}, writeHead(code) { status = code; return this; }, end(value) { body = JSON.parse(value); } };
      const request = { method: "POST", headers: { host: "localhost:5173", origin: "http://localhost:5173", "content-type": "application/json" }, socket: { remoteAddress: "test" }, body: {} };
      await setupNotificationHandler(request, response, options);
      return { status, body };
    }
    assert.equal((await submit()).status, 200);
    assert.equal((await submit()).status, 200);
    assert.equal(deliveries, 1);
    assert.equal((await listWalletRequests(database, owner)).length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldToken === undefined) delete process.env.SPOT_TELEGRAM_BOT_TOKEN; else process.env.SPOT_TELEGRAM_BOT_TOKEN = oldToken;
    if (oldChat === undefined) delete process.env.SPOT_TELEGRAM_CHAT_ID; else process.env.SPOT_TELEGRAM_CHAT_ID = oldChat;
    await database.end(); await server.close();
  }
});
