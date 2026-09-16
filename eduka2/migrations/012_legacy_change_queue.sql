CREATE TABLE IF NOT EXISTS eduka_legacy_changes (
 id BIGSERIAL PRIMARY KEY, center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
 source_table TEXT NOT NULL, record_id UUID NOT NULL, old_row JSONB, new_row JSONB,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS eduka_legacy_pending ON eduka_legacy_changes(center_id,id);
CREATE OR REPLACE FUNCTION eduka_capture_legacy() RETURNS TRIGGER AS $$
DECLARE old_value JSONB; new_value JSONB; cid UUID; rid UUID;
BEGIN
 IF current_setting('eduka.workspace_write',TRUE)='1' THEN RETURN COALESCE(NEW,OLD); END IF;
 IF TG_OP<>'INSERT' THEN old_value=to_jsonb(OLD)-'password_hash'; END IF;
 IF TG_OP<>'DELETE' THEN new_value=to_jsonb(NEW)-'password_hash'; END IF;
 cid=COALESCE((new_value->>'center_id')::UUID,(old_value->>'center_id')::UUID);
 rid=COALESCE((new_value->>'id')::UUID,(old_value->>'id')::UUID);
 IF cid IS NOT NULL AND rid IS NOT NULL AND EXISTS(SELECT 1 FROM centers WHERE id=cid) THEN
 INSERT INTO eduka_legacy_changes(center_id,source_table,record_id,old_row,new_row) VALUES(cid,TG_TABLE_NAME,rid,old_value,new_value);
 END IF;
 RETURN COALESCE(NEW,OLD);
END;
$$ LANGUAGE plpgsql;
DO $$ DECLARE table_name TEXT; BEGIN
 FOREACH table_name IN ARRAY ARRAY['center_branches','courses','rooms','finance_cashboxes','teachers','study_groups','students','group_students','attendance','reminders','center_payments','leads','center_users','center_expenses'] LOOP
 EXECUTE format('DROP TRIGGER IF EXISTS eduka_legacy_capture ON %I',table_name);
 EXECUTE format('CREATE TRIGGER eduka_legacy_capture AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION eduka_capture_legacy()',table_name);
 END LOOP;
END $$;
