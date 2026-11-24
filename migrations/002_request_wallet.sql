-- A connected owner is stored for new submissions; older records are not silently assigned.
ALTER TABLE portal_setup_requests ADD COLUMN IF NOT EXISTS owner_wallet text;
CREATE INDEX IF NOT EXISTS portal_setup_requests_owner_idx
  ON portal_setup_requests (lower(owner_wallet), created_at DESC) WHERE delivered_at IS NOT NULL;
