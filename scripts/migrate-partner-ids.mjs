import { readFile } from "node:fs/promises";
import pg from "pg";
import { generateSpotAppId } from "../src/features/onboarding/spot/app-id.ts";

const connectionString = process.env.PORTAL_DATABASE_URL?.trim();
if (!connectionString) throw new Error("Set PORTAL_DATABASE_URL before running this migration.");
const pool = new pg.Pool({ connectionString, max: 1 });
try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE portal_setup_requests IN SHARE ROW EXCLUSIVE MODE");
    await client.query("ALTER TABLE portal_setup_requests ADD COLUMN IF NOT EXISTS partner_id text");
    const legacy = await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'portal_setup_requests' AND column_name = 'app_id'");
    if (legacy.rowCount) {
      const mismatches = await client.query("SELECT count(*)::int AS count FROM portal_setup_requests WHERE product = 'spot' AND partner_id IS NOT NULL AND app_id IS NOT NULL AND partner_id <> app_id");
      if (mismatches.rows[0].count) throw new Error("Some Spot identifiers differ; resolve them before migrating.");
      await client.query("UPDATE portal_setup_requests SET partner_id = app_id WHERE product = 'spot' AND partner_id IS NULL AND app_id IS NOT NULL");
    }
    await client.query("UPDATE portal_setup_requests SET partner_id = details->>'partnerId' WHERE product = 'perps' AND partner_id IS NULL");
    const missing = await client.query("SELECT id, details->>'appName' AS name FROM portal_setup_requests WHERE product = 'spot' AND partner_id IS NULL");
    for (const row of missing.rows) {
      if (typeof row.name !== "string" || !generateSpotAppId(row.name)) throw new Error("A Spot request has no usable app name; resolve it before migrating.");
      await client.query("UPDATE portal_setup_requests SET partner_id = $1 WHERE id = $2", [generateSpotAppId(row.name), row.id]);
    }
    const incomplete = await client.query("SELECT count(*)::int AS count FROM portal_setup_requests WHERE partner_id IS NULL OR partner_id = ''");
    if (incomplete.rows[0].count) throw new Error("Some requests have no usable Partner ID; resolve them before migrating.");
    await client.query(await readFile(new URL("../migrations/007_unique_partner_id.sql", import.meta.url), "utf8"));
    await client.query(await readFile(new URL("../migrations/008_product_partner_id.sql", import.meta.url), "utf8"));
    await client.query("COMMIT");
    console.log("Partner ID migration completed for Spot and Perps requests.");
  } catch (error) {
    await client.query("ROLLBACK");
    if (error && typeof error === "object" && error.code === "23505") throw new Error("Existing requests have duplicate Partner IDs within a product; resolve them before migrating.");
    throw error;
  } finally { client.release(); }
} finally { await pool.end(); }
