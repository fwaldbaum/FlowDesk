// FlowDesk schema. Idempotent: safe to run on every boot or cold start.
// Kept as a JS module (not a .sql file) so serverless bundlers always include it.
export const SCHEMA_SQL = `
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

-- ---- v3: multi-workspace accounts, onboarding survey, platform admin ---------

CREATE TABLE IF NOT EXISTS workspaces (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  -- Identifies the workspace on POST /api/webhooks/lead. gen_random_uuid() is CSPRNG-backed.
  webhook_key TEXT        NOT NULL UNIQUE
              DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users          ADD COLUMN IF NOT EXISTS workspace_id  INTEGER REFERENCES workspaces (id) ON DELETE CASCADE;
ALTER TABLE users          ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE users          ADD COLUMN IF NOT EXISTS job_title     TEXT;
ALTER TABLE users          ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users          ADD COLUMN IF NOT EXISTS banned_at     TIMESTAMPTZ;
ALTER TABLE users          ADD COLUMN IF NOT EXISTS ban_reason    TEXT;
ALTER TABLE users          ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE leads          ADD COLUMN IF NOT EXISTS workspace_id  INTEGER REFERENCES workspaces (id) ON DELETE CASCADE;
-- Nullable: a request with an unknown key has no workspace.
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS workspace_id  INTEGER REFERENCES workspaces (id) ON DELETE CASCADE;
ALTER TABLE events         ADD COLUMN IF NOT EXISTS workspace_id  INTEGER REFERENCES workspaces (id) ON DELETE CASCADE;

DO $$
DECLARE ws INTEGER;
BEGIN
  -- Data from the single-workspace era moves into one workspace.
  IF EXISTS (SELECT 1 FROM users WHERE workspace_id IS NULL)
     OR EXISTS (SELECT 1 FROM leads WHERE workspace_id IS NULL) THEN
    INSERT INTO workspaces (name) VALUES ('Mi espacio') RETURNING id INTO ws;
    UPDATE users SET workspace_id = ws WHERE workspace_id IS NULL;
    UPDATE leads SET workspace_id = ws WHERE workspace_id IS NULL;
    UPDATE webhook_events SET workspace_id = ws WHERE workspace_id IS NULL;
  END IF;
  DELETE FROM events WHERE workspace_id IS NULL;

  -- Someone must be able to open the admin panel: promote the oldest account.
  IF NOT EXISTS (SELECT 1 FROM users WHERE is_admin) THEN
    UPDATE users SET is_admin = true WHERE id = (SELECT min(id) FROM users);
  END IF;

  -- Tighten constraints once (skipped afterwards to avoid a table lock on every boot).
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'leads' AND column_name = 'workspace_id' AND is_nullable = 'YES') THEN
    ALTER TABLE leads ALTER COLUMN workspace_id SET NOT NULL;
    ALTER TABLE users ALTER COLUMN workspace_id SET NOT NULL;
    ALTER TABLE events ALTER COLUMN workspace_id SET NOT NULL;
  END IF;
END $$;

DROP INDEX IF EXISTS leads_status_position_idx;
CREATE INDEX IF NOT EXISTS leads_ws_status_position_idx ON leads (workspace_id, status, position);
CREATE INDEX IF NOT EXISTS users_workspace_idx ON users (workspace_id);
CREATE INDEX IF NOT EXISTS events_ws_idx ON events (workspace_id, id);
CREATE INDEX IF NOT EXISTS webhook_events_ws_idx ON webhook_events (workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS survey_responses (
  user_id           INTEGER     PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  heard_from        TEXT        NOT NULL,
  heard_from_detail TEXT,
  company_size      TEXT        NOT NULL,
  company_about     TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Who did what in the admin panel. Emails are copied so entries survive deletions.
CREATE TABLE IF NOT EXISTS admin_actions (
  id             SERIAL PRIMARY KEY,
  admin_id       INTEGER     REFERENCES users (id) ON DELETE SET NULL,
  admin_email    TEXT,
  target_user_id INTEGER     REFERENCES users (id) ON DELETE SET NULL,
  target_email   TEXT,
  action         TEXT        NOT NULL,
  details        JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_target_idx ON admin_actions (target_user_id, created_at DESC);
`;
