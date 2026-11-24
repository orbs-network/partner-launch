-- Keep historical submitting wallets and add independently indexed co-owners.
CREATE TABLE IF NOT EXISTS portal_request_owners (
  request_id uuid NOT NULL REFERENCES portal_setup_requests(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  PRIMARY KEY (request_id, wallet_address)
);
CREATE INDEX IF NOT EXISTS portal_request_owners_wallet_idx ON portal_request_owners (wallet_address, request_id);
INSERT INTO portal_request_owners (request_id, wallet_address)
SELECT id, lower(owner_wallet) FROM portal_setup_requests WHERE owner_wallet IS NOT NULL
ON CONFLICT (request_id, wallet_address) DO NOTHING;
