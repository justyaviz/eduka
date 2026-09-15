-- EDUKA CRM v0.9.3 — Leads assignment/callback. Non-destructive and idempotent.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES center_users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_contact_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_leads_center_status ON leads(center_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_center_assigned ON leads(center_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_center_next_contact ON leads(center_id, next_contact_at);
