ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS uploaded_assets (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  url TEXT NOT NULL,
  github_path TEXT,
  storage TEXT DEFAULT 'github',
  mime_type TEXT,
  size_bytes INTEGER DEFAULT 0,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_assets_org ON uploaded_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_assets_entity ON uploaded_assets(entity, entity_id);
