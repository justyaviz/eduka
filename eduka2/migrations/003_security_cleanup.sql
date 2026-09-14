-- Remove legacy plaintext credentials after copying them into center_users as bcrypt/crypt hashes.
DO $$
BEGIN
  IF to_regclass('public.crm_tenant_admins') IS NOT NULL THEN
    INSERT INTO center_users (center_id, full_name, email, password_hash, role, status)
    SELECT c.id,
           COALESCE(NULLIF(a.name,''), 'Center Admin'),
           COALESCE(NULLIF(a.email,''), 'admin+' || regexp_replace(lower(COALESCE(c.subdomain,'center')), '[^a-z0-9]+', '-', 'g') || '@eduka.local'),
           crypt(a.password, gen_salt('bf', 12)),
           COALESCE(NULLIF(a.role,''), 'director'),
           CASE WHEN COALESCE(a.status,'active')='deleted' THEN 'inactive' ELSE 'active' END
      FROM crm_tenant_admins a
      JOIN centers c
        ON lower(c.subdomain)=lower(a.tenant)
        OR lower(c.subdomain)=lower(a.tenant || '.eduka.uz')
        OR lower(c.subdomain || '.eduka.uz')=lower(a.tenant)
     WHERE COALESCE(a.password,'') <> ''
       AND COALESCE(a.password,'') NOT LIKE 'MIGRATED_DISABLED_%'
    ON CONFLICT (center_id, email) DO NOTHING;

    UPDATE crm_tenant_admins
       SET password='MIGRATED_DISABLED_' || id::text
     WHERE COALESCE(password,'') <> ''
       AND password NOT LIKE 'MIGRATED_DISABLED_%';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='organizations' AND column_name='admin_password'
     ) THEN
    EXECUTE 'UPDATE organizations SET admin_password=NULL WHERE admin_password IS NOT NULL';
  END IF;
END $$;

ALTER TABLE demo_requests DROP COLUMN IF EXISTS password_text;
