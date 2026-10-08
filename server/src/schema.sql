-- FlowDesk schema. Idempotent: safe to run on every boot.

CREATE TABLE IF NOT EXISTS leads (
  id              SERIAL PRIMARY KEY,
  name            TEXT        NOT NULL,
  email           TEXT,
  phone           TEXT,
  company         TEXT,
  source          TEXT        NOT NULL DEFAULT 'Manual',
  value           NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'contacted', 'proposal', 'won', 'lost')),
  position        INTEGER     NOT NULL DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_status_position_idx ON leads (status, position);

CREATE TABLE IF NOT EXISTS notes (
  id         SERIAL PRIMARY KEY,
  lead_id    INTEGER     NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  kind       TEXT        NOT NULL DEFAULT 'note'
             CHECK (kind IN ('note', 'reminder', 'event')),
  body       TEXT        NOT NULL,
  due_at     TIMESTAMPTZ,
  done       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_lead_idx ON notes (lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS webhook_events (
  id          SERIAL PRIMARY KEY,
  status      TEXT        NOT NULL CHECK (status IN ('accepted', 'rejected')),
  lead_id     INTEGER     REFERENCES leads (id) ON DELETE SET NULL,
  payload     JSONB,
  error       TEXT,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_events_created_idx ON webhook_events (created_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only a SHA-256 of the session token is stored, so a DB leak can't be replayed as cookies.
CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL PRIMARY KEY,
  token_hash  TEXT        NOT NULL UNIQUE,
  user_id     INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

-- Realtime feed for deployments without WebSockets (e.g. Vercel). Rows are short-lived.
CREATE TABLE IF NOT EXISTS events (
  id         BIGSERIAL PRIMARY KEY,
  type       TEXT        NOT NULL,
  payload    JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at);
