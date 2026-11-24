import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
type Database = Pool | PoolClient;

export interface NewSetupRequest {
  id: string;
  product: "spot" | "perps";
  accessToken: string;
  details: Record<string, unknown>;
  ownerWallet?: string;
  ownerWallets?: string[];
  partnerId: string;
}

function tokenHash(token: string): string {
  if (!/^[a-f\d]{64}$/i.test(token)) throw new Error("Invalid request access token.");
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Idempotent only for the same ID, token and exact validated details. */
export async function saveSetupRequest(database: Database, request: NewSetupRequest): Promise<void> {
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(request.id)) throw new Error("Invalid request ID.");
  if (request.ownerWallets && (!Array.isArray(request.details.ownerWallets) ||
    JSON.stringify(request.ownerWallets.map(value => value.toLowerCase())) !==
      JSON.stringify(request.details.ownerWallets.map(value => typeof value === "string" ? value.toLowerCase() : null))))
    throw new Error("The request owner wallets changed. Please start a new submission.");
  const result = await database.query(
    `INSERT INTO portal_setup_requests (id, product, access_token_hash, details, owner_wallet, partner_id)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)
     ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
     WHERE portal_setup_requests.product = EXCLUDED.product
       AND portal_setup_requests.access_token_hash = EXCLUDED.access_token_hash
       AND portal_setup_requests.details = EXCLUDED.details
       AND (portal_setup_requests.owner_wallet = EXCLUDED.owner_wallet OR
         (portal_setup_requests.owner_wallet IS NULL AND EXCLUDED.owner_wallet IS NULL))
       AND (portal_setup_requests.partner_id = EXCLUDED.partner_id OR
         (portal_setup_requests.partner_id IS NULL AND EXCLUDED.partner_id IS NULL))
     RETURNING id`,
    [request.id, request.product, tokenHash(request.accessToken), JSON.stringify(request.details), request.ownerWallet?.toLowerCase() ?? null, request.partnerId],
  );
  if (!result.rowCount) throw new Error("The request changed. Please start a new submission.");
  const owners = [...new Set([...(request.ownerWallet ? [request.ownerWallet] : []), ...(request.ownerWallets ?? [])].map(address => address.toLowerCase()))];
  if (owners.length) {
    const values = owners.map((_, index) => `($1, $${index + 2})`).join(", ");
    await database.query(`INSERT INTO portal_request_owners (request_id, wallet_address) VALUES ${values} ON CONFLICT (request_id, wallet_address) DO NOTHING`, [request.id, ...owners]);
  }
}

/** IDs are unique within each product and remain reserved after cancellation. */
export async function partnerIdExists(database: Database, partnerId: string, product: NewSetupRequest["product"]): Promise<boolean> {
  const result = await database.query("SELECT 1 FROM portal_setup_requests WHERE product = $1 AND lower(partner_id) = lower($2) LIMIT 1", [product, partnerId]);
  return !!result.rowCount;
}

/** Return only display fields for this authenticated owner, never private contact or token hashes. */
export async function listWalletRequests(database: Pool, address: string) {
  const result = await database.query<{
    id: string; product: "spot" | "perps"; details: Record<string, unknown>; status: string; created_at: Date; owner_wallet: string | null; partner_id: string | null;
  }>(
    `SELECT id, product, details, status, created_at, owner_wallet, partner_id FROM portal_setup_requests
     WHERE lower(owner_wallet) = lower($1) AND delivered_at IS NOT NULL AND status <> 'cancelled'
     ORDER BY created_at DESC`, [address],
  );
  return result.rows.map(row => {
    const details = row.details;
    return {
      id: row.id, kind: row.product, status: row.status, appName: details.appName,
      savedAt: new Date(row.created_at).toISOString(), ownerWallets: [...new Set([...(row.owner_wallet ? [row.owner_wallet] : []),
        ...(Array.isArray(details.ownerWallets) ? details.ownerWallets.filter((value): value is string => typeof value === "string") : [])].map(value => value.toLowerCase()))],
      ...(row.product === "spot" ? { feesWallet: details.feesWallet, ...(details.integrationMode === "ui" || details.integrationMode === "existing" ? { integrationMode: details.integrationMode } : {}), ...(typeof details.tradingFeeTenthsBps === "number" ? { tradingFeeTenthsBps: details.tradingFeeTenthsBps } : {}), ...(row.partner_id ? { partnerId: row.partner_id } : {}), ...(details.dexUrl ? { dexUrl: details.dexUrl } : {}) } : {
        partnerId: details.partnerId, chainIds: details.chainIds, revenueWallet: details.revenueWallet,
        ...(typeof details.appUrl === "string" && details.appUrl ? { appUrl: details.appUrl } : {}),
        appUrlVersion: Number.isSafeInteger(details.appUrlVersion) && Number(details.appUrlVersion) >= 0 ? details.appUrlVersion : 0,
        ...(details.integrationMode === "ui" || details.integrationMode === "api" ? { integrationMode: details.integrationMode } : {}),
        ...(typeof details.builderFeeTenthsBps === "number" ? { builderFeeTenthsBps: details.builderFeeTenthsBps } : {}),
      }),
    };
  });
}

/** Only a delivered request is visible for administrative review. */
export async function markRequestDelivered(database: Database, id: string, token: string): Promise<void> {
  const result = await database.query(
    "UPDATE portal_setup_requests SET delivered_at = COALESCE(delivered_at, now()) WHERE id = $1 AND access_token_hash = $2 RETURNING id",
    [id, tokenHash(token)],
  );
  if (!result.rowCount) throw new Error("Request delivery could not be saved.");
}

/** Public status lookup requires the caller's unguessable request token. */
export async function getRequestStatus(database: Database, id: string, token: string): Promise<string | undefined> {
  const result = await database.query<{ status: string }>(
    "SELECT status FROM portal_setup_requests WHERE id = $1 AND access_token_hash = $2 AND delivered_at IS NOT NULL",
    [id, tokenHash(token)],
  );
  return result.rows[0]?.status;
}

export async function listReviewRequests(database: Pool) {
  const result = await database.query(
    "SELECT id, product, details, partner_id, owner_wallet, status, created_at, approved_at, approved_by FROM portal_setup_requests WHERE delivered_at IS NOT NULL ORDER BY created_at DESC",
  );
  return result.rows;
}

/** Conditional update prevents approval of a cancelled, undelivered or changed-status request. */
export async function approveSetupRequest(database: Pool, id: string, admin: string): Promise<boolean> {
  const result = await database.query(
    "UPDATE portal_setup_requests SET status = 'approved', approved_at = now(), approved_by = $2 WHERE id = $1 AND status = 'pending' AND delivered_at IS NOT NULL RETURNING id",
    [id, admin.toLowerCase()],
  );
  return !!result.rowCount;
}
