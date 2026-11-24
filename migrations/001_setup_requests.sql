-- Apply explicitly to the portal's PostgreSQL database before enabling the request API.
-- Request access tokens are never stored in plaintext.
CREATE TABLE IF NOT EXISTS portal_setup_requests (
  id uuid PRIMARY KEY,
  product text NOT NULL CHECK (product IN ('spot', 'perps')),
  access_token_hash text NOT NULL CHECK (length(access_token_hash) = 64),
  details jsonb NOT NULL CHECK (jsonb_typeof(details) = 'object'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  CONSTRAINT portal_approval_consistent CHECK (
    (status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR
    (status <> 'approved' AND approved_at IS NULL AND approved_by IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS portal_setup_requests_review_idx
  ON portal_setup_requests (status, created_at DESC) WHERE delivered_at IS NOT NULL;
