-- EDUKA CRM v0.8.3 — real multi-branch foundation. Non-destructive and idempotent.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS center_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_main BOOLEAN DEFAULT FALSE,
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE center_users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES center_branches(id) ON DELETE SET NULL;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES center_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_center_branches_center ON center_branches(center_id);
CREATE INDEX IF NOT EXISTS idx_center_users_branch ON center_users(center_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_branch ON study_groups(center_id, branch_id);

-- Every existing center gets one safe main branch exactly once.
INSERT INTO center_branches(center_id,name,phone,address,is_main,status)
SELECT c.id,
       COALESCE(NULLIF(c.name,''),'Asosiy filial'),
       c.owner_phone,
       (SELECT cs.value FROM center_settings cs WHERE cs.center_id=c.id AND cs.key='address' LIMIT 1),
       TRUE,
       'active'
  FROM centers c
 WHERE NOT EXISTS (
   SELECT 1 FROM center_branches b WHERE b.center_id=c.id AND COALESCE(b.status,'active')<>'deleted'
 );

-- Ensure one main branch exists if branches were manually seeded before this migration.
UPDATE center_branches b
   SET is_main=TRUE, updated_at=NOW()
 WHERE b.id IN (
   SELECT DISTINCT ON (center_id) id
     FROM center_branches x
    WHERE COALESCE(x.status,'active')<>'deleted'
      AND NOT EXISTS (
        SELECT 1 FROM center_branches m
         WHERE m.center_id=x.center_id AND m.is_main=TRUE AND COALESCE(m.status,'active')<>'deleted'
      )
    ORDER BY center_id, created_at ASC
 );

-- Existing users/groups belong to the main branch until explicitly reassigned.
UPDATE center_users u
   SET branch_id=(SELECT b.id FROM center_branches b WHERE b.center_id=u.center_id AND b.is_main=TRUE AND COALESCE(b.status,'active')<>'deleted' ORDER BY b.created_at ASC LIMIT 1),
       updated_at=NOW()
 WHERE u.branch_id IS NULL;

UPDATE study_groups g
   SET branch_id=(SELECT b.id FROM center_branches b WHERE b.center_id=g.center_id AND b.is_main=TRUE AND COALESCE(b.status,'active')<>'deleted' ORDER BY b.created_at ASC LIMIT 1),
       updated_at=NOW()
 WHERE g.branch_id IS NULL;

-- New staff/groups automatically enter the main branch unless a branch is explicitly supplied.
CREATE OR REPLACE FUNCTION eduka_assign_main_branch() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.branch_id IS NULL AND NEW.center_id IS NOT NULL THEN
    SELECT id INTO NEW.branch_id
      FROM center_branches
     WHERE center_id=NEW.center_id AND is_main=TRUE AND COALESCE(status,'active')<>'deleted'
     ORDER BY created_at ASC LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_center_users_main_branch ON center_users;
CREATE TRIGGER trg_center_users_main_branch
BEFORE INSERT ON center_users
FOR EACH ROW EXECUTE FUNCTION eduka_assign_main_branch();

DROP TRIGGER IF EXISTS trg_study_groups_main_branch ON study_groups;
CREATE TRIGGER trg_study_groups_main_branch
BEFORE INSERT ON study_groups
FOR EACH ROW EXECUTE FUNCTION eduka_assign_main_branch();

UPDATE centers c
   SET branches_count=(SELECT COUNT(*)::int FROM center_branches b WHERE b.center_id=c.id AND COALESCE(b.status,'active')<>'deleted'),
       updated_at=NOW();
