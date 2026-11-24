-- Run after populating partner_id. Conflicting or missing IDs abort the transaction.
DROP TRIGGER IF EXISTS portal_sync_partner_id_trigger ON portal_setup_requests;
DROP FUNCTION IF EXISTS portal_sync_partner_id();
ALTER TABLE portal_setup_requests ALTER COLUMN partner_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS portal_partner_id_unique ON portal_setup_requests (lower(partner_id));
ALTER TABLE portal_setup_requests DROP COLUMN IF EXISTS app_id;
DROP INDEX IF EXISTS portal_spot_active_partner_id_unique;
