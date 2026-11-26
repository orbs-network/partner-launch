import type { PoolClient } from "pg";

/** The owner is the wallet associated with submission, not the additional app-owner list. */
export async function lockOwnedSpotRequest(database: PoolClient, id: string, owner: string): Promise<(Record<string, unknown> & { partnerId: string | null }) | undefined> {
  const result = await database.query<{ details: Record<string, unknown>; partner_id: string | null }>(
    "SELECT details, partner_id FROM portal_setup_requests WHERE id = $1 AND lower(owner_wallet) = lower($2) AND product = 'spot' AND status = 'pending' AND delivered_at IS NOT NULL FOR UPDATE",
    [id, owner]);
  const row = result.rows[0];
  return row ? { ...row.details, partnerId: row.partner_id } : undefined;
}

export async function cancelOwnedSpotRequest(database: PoolClient, id: string, owner: string): Promise<boolean> {
  const result = await database.query(
    "UPDATE portal_setup_requests SET status = 'cancelled' WHERE id = $1 AND lower(owner_wallet) = lower($2) AND product = 'spot' AND status = 'pending' AND delivered_at IS NOT NULL RETURNING id",
    [id, owner]);
  return !!result.rowCount;
}
