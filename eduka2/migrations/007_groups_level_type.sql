-- EDUKA CRM v0.9.4 — group academic metadata. Non-destructive and idempotent.
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS level_id VARCHAR(120);
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS group_type VARCHAR(80) DEFAULT 'standard';

UPDATE study_groups SET group_type='standard' WHERE group_type IS NULL OR btrim(group_type)='';

CREATE INDEX IF NOT EXISTS idx_groups_center_level ON study_groups(center_id, level_id);
CREATE INDEX IF NOT EXISTS idx_groups_center_branch_status ON study_groups(center_id, branch_id, status);
