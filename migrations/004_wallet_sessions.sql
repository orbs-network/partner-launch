-- Server-side wallet sessions: a signed proof is accepted once and exchanged for an HttpOnly cookie.
-- Session tokens are never stored in plaintext.
CREATE TABLE IF NOT EXISTS portal_sessions (
  token_hash text PRIMARY KEY CHECK (length(token_hash) = 64),
  wallet_address text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('wallet', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_sessions_expiry_idx ON portal_sessions (expires_at);

-- Proof nonces already exchanged for a session; replaying a proof is rejected.
CREATE TABLE IF NOT EXISTS portal_used_proofs (
  nonce uuid PRIMARY KEY,
  used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portal_used_proofs_age_idx ON portal_used_proofs (used_at);

-- Contact details belong only in the team's Telegram message, never in stored request details.
UPDATE portal_setup_requests SET details = details - 'contact' WHERE details ? 'contact';
