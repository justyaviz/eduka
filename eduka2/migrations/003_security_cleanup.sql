-- EDUKA V3 credential compatibility migration.
-- IMPORTANT FOR LAUNCH: copy legacy credentials into bcrypt-compatible
-- `center_users`, but DO NOT destroy the legacy values yet. Keeping the old
-- values for the first rollout preserves an immediate rollback path. A later
-- verified migration can scrub/drop plaintext legacy columns.

DO $$
BEGIN
  IF to_regclass('public.crm_tenant_admins') IS NOT NULL THEN
    INSERT INTO center_users (center_id, full_name, email, password_hash, role, status)
    SELECT c.id,
           COALESCE(NULLIF(a.name,''), 'Center Admin'),
           COALESCE(
             NULLIF(a.email,''),
             'admin+' || regexp_replace(lower(COALESCE(c.subdomain,'center')), '[^a-z0-9]+', '-', 'g') || '@eduka.local'
           ),
           crypt(a.password, gen_salt('bf', 12)),
           COALESCE(NULLIF(a.role,''), 'director'),
           CASE WHEN lower(COALESCE(a.status,'active')) IN ('deleted','inactive','blocked') THEN 'inactive' ELSE 'active' END
      FROM crm_tenant_admins a
      JOIN centers c
        ON lower(regexp_replace(COALESCE(c.subdomain,''), '\.eduka\.uz$', '')) =
           lower(regexp_replace(COALESCE(a.tenant,''), '\.eduka\.uz$', ''))
     WHERE COALESCE(a.password,'') <> ''
       AND COALESCE(a.password,'') NOT LIKE 'MIGRATED_DISABLED_%'
    ON CONFLICT (center_id, email) DO NOTHING;
  END IF;
END $$;

-- Some older tenants authenticated directly from `organizations`. Migrate
-- those too when a usable plaintext legacy password is still present.
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL THEN
    INSERT INTO center_users (center_id, full_name, email, password_hash, role, status)
    SELECT c.id,
           COALESCE(NULLIF(o.owner_name,''), NULLIF(o.name,''), 'Center Admin'),
           COALESCE(
             NULLIF(o.email,''),
             'admin+' || regexp_replace(lower(COALESCE(c.subdomain,'center')), '[^a-z0-9]+', '-', 'g') || '@eduka.local'
           ),
           crypt(o.admin_password, gen_salt('bf', 12)),
           'director',
           CASE WHEN lower(COALESCE(o.status,'active')) IN ('deleted','inactive','blocked') THEN 'inactive' ELSE 'active' END
      FROM organizations o
      JOIN centers c
        ON lower(regexp_replace(COALESCE(c.subdomain,''), '\.eduka\.uz$', '')) =
           lower(regexp_replace(COALESCE(NULLIF(o.subdomain,''), o.name), '\.eduka\.uz$', ''))
     WHERE COALESCE(o.admin_password,'') <> ''
       AND COALESCE(o.admin_password,'') NOT LIKE 'MIGRATED_DISABLED_%'
    ON CONFLICT (center_id, email) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

-- Do not DROP demo_requests.password_text in the launch migration. The new
-- frontend/API no longer writes it, but leaving the legacy column temporarily
-- keeps the pre-launch rollback branch schema-compatible.
