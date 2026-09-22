-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,              -- 6-char code (e.g., "ABC123")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false
);

-- Yjs document persistence (managed by SupabasePersistence)
CREATE TABLE IF NOT EXISTS yjs_documents (
  room TEXT PRIMARY KEY,
  state BYTEA NOT NULL DEFAULT ''::bytea,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime publication on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE yjs_documents;

-- Row Level Security (RLS) policies (allow public/anonymous read & write for portfolio)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE yjs_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public boards" ON boards
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public yjs docs" ON yjs_documents
  FOR ALL USING (true) WITH CHECK (true);
