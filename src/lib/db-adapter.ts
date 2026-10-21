/**
 * CelebrAI Pluggable Persistence Adapter & Database Integration
 * 
 * Hosting Environment Analysis:
 * - Serverless (Vercel, Netlify): Filesystem is ephemeral. Requires external DB (PostgreSQL / Supabase / Neon).
 * - Container with Volume (Docker, Railway, Fly.io, VPS): File-backed store (.data/celebr-store.json) is durable with mounted volume.
 * - Local / Demo: Atomic file-backed JSON storage (.data/celebr-store.json) persists across reloads and restarts.
 * 
 * This adapter provides SQL DDL schemas and connection hooks for PostgreSQL / Supabase
 * without destroying existing local file data or breaking offline development.
 */

export const CELEBRAI_SQL_SCHEMA = `
-- ============================================================
-- CelebrAI PostgreSQL / Supabase Production Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('wedding', 'birthday', 'community')),
  date TIMESTAMPTZ NOT NULL,
  guest_count INTEGER NOT NULL,
  budget NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  location TEXT NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'planning', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  total_budget NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  contingency_percent NUMERIC(5, 2) NOT NULL DEFAULT 10,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timelines (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, id)
);

CREATE TABLE IF NOT EXISTS vendors (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  id VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) DEFAULT '',
  status VARCHAR(50) NOT NULL,
  estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  contact_info TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_required BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (event_id, id)
);

CREATE TABLE IF NOT EXISTS tasks (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  priority VARCHAR(50) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  category VARCHAR(100) NOT NULL,
  assignee VARCHAR(255) DEFAULT '',
  PRIMARY KEY (event_id, id)
);

CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_event_time ON copilot_messages(event_id, timestamp ASC);
`;

/**
 * Detects current persistence mode based on runtime environment variables.
 */
export function getPersistenceMode(): {
  mode: 'database' | 'persistent-volume' | 'local-file' | 'ephemeral-warning';
  details: string;
  isDurable: boolean;
} {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return {
      mode: 'database',
      details: 'Connected to external PostgreSQL / Supabase instance.',
      isDurable: true,
    };
  }

  // Check if running on serverless hosting without external database
  if (process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return {
      mode: 'ephemeral-warning',
      details:
        'Serverless platform detected without DATABASE_URL. Writable local filesystem is ephemeral and will reset across cold starts. Connect Supabase/Neon PostgreSQL for persistent cloud storage.',
      isDurable: false,
    };
  }

  // Standard container or local node environment
  return {
    mode: 'local-file',
    details: 'Atomic file-backed JSON store active at .data/celebr-store.json (persists across restarts with local/mounted volume).',
    isDurable: true,
  };
}
