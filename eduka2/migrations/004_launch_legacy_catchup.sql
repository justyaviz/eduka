-- Launch compatibility catch-up for tenants that existed only in the legacy CRM tables.
DO $$
BEGIN
  IF to_regclass('public.crm_centers') IS NOT NULL THEN
    INSERT INTO centers (name,subdomain,owner_name,owner_phone,tariff,status,trial_ends_at,created_at,updated_at)
    SELECT COALESCE(NULLIF(trim(x.name),''),trim(x.subdomain)),
           regexp_replace(lower(trim(x.subdomain)),'\.eduka\.uz$',''),
           x.owner_name,x.phone,COALESCE(NULLIF(x.tariff,''),'Start'),
           CASE lower(COALESCE(x.status,'active')) WHEN 'trial' THEN 'Trial' WHEN 'suspended' THEN 'Suspended' WHEN 'expired' THEN 'Expired' WHEN 'blocked' THEN 'Blocked' ELSE 'Active' END,
           x.trial_ends_at,COALESCE(x.created_at,NOW()),COALESCE(x.updated_at,NOW())
      FROM crm_centers x
     WHERE COALESCE(trim(x.subdomain),'')<>''
       AND NOT EXISTS (SELECT 1 FROM centers c WHERE lower(regexp_replace(COALESCE(c.subdomain,''),'\.eduka\.uz$',''))=lower(regexp_replace(x.subdomain,'\.eduka\.uz$','')));
  END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL THEN
    INSERT INTO centers (name,subdomain,owner_name,owner_phone,owner_email,tariff,status,created_at,updated_at)
    SELECT COALESCE(NULLIF(trim(o.name),''),trim(o.subdomain)),
           regexp_replace(lower(trim(COALESCE(NULLIF(o.subdomain,''),o.name))),'\.eduka\.uz$',''),
           o.owner_name,o.phone,o.email,'Start',
           CASE lower(COALESCE(o.status,'active')) WHEN 'trial' THEN 'Trial' WHEN 'suspended' THEN 'Suspended' WHEN 'expired' THEN 'Expired' WHEN 'blocked' THEN 'Blocked' ELSE 'Active' END,
           NOW(),NOW()
      FROM organizations o
     WHERE COALESCE(trim(COALESCE(NULLIF(o.subdomain,''),o.name)),'')<>''
       AND NOT EXISTS (SELECT 1 FROM centers c WHERE lower(regexp_replace(COALESCE(c.subdomain,''),'\.eduka\.uz$',''))=lower(regexp_replace(COALESCE(NULLIF(o.subdomain,''),o.name),'\.eduka\.uz$','')));
  END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Credentials are copied to bcrypt center_users but legacy values stay untouched for rollback.
DO $$
BEGIN
  IF to_regclass('public.crm_tenant_admins') IS NOT NULL THEN
    INSERT INTO center_users (center_id,full_name,email,password_hash,role,status)
    SELECT c.id,COALESCE(NULLIF(a.name,''),'Center Admin'),
           COALESCE(NULLIF(a.email,''),'admin+'||regexp_replace(lower(c.subdomain),'[^a-z0-9]+','-','g')||'@eduka.local'),
           crypt(a.password,gen_salt('bf',12)),COALESCE(NULLIF(a.role,''),'director'),'active'
      FROM crm_tenant_admins a
      JOIN centers c ON lower(regexp_replace(COALESCE(c.subdomain,''),'\.eduka\.uz$',''))=lower(regexp_replace(COALESCE(a.tenant,''),'\.eduka\.uz$',''))
     WHERE COALESCE(a.password,'')<>'' AND a.password NOT LIKE 'MIGRATED_DISABLED_%'
    ON CONFLICT (center_id,email) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Older crm_groups did not have room_id/end_date/lesson_duration. Copy their base fields.
DO $$
BEGIN
  IF to_regclass('public.crm_groups') IS NOT NULL THEN
    INSERT INTO study_groups (id,center_id,name,course_id,teacher_id,room_name,days_text,lesson_time,started_at,course_name,teacher_name,schedule_text,monthly_price,status,created_at,updated_at)
    SELECT g.id,c.id,g.name,g.course_id,g.teacher_id,g.room,g.days,g.lesson_time,g.start_date,
           co.name,t.full_name,trim(concat_ws(' ',g.days,g.lesson_time)),COALESCE(co.price,0),COALESCE(g.status,'active'),g.created_at,g.updated_at
      FROM crm_groups g
      JOIN centers c ON lower(regexp_replace(COALESCE(c.subdomain,''),'\.eduka\.uz$',''))=lower(regexp_replace(g.tenant,'\.eduka\.uz$',''))
      LEFT JOIN courses co ON co.id=g.course_id
      LEFT JOIN teachers t ON t.id=g.teacher_id
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_attendance') IS NOT NULL THEN
    INSERT INTO attendance (id,center_id,group_id,student_id,lesson_date,status,note,created_at)
    SELECT a.id,c.id,a.group_id,a.student_id,a.date,COALESCE(a.status,'present'),a.note,COALESCE(a.created_at,NOW())
      FROM crm_attendance a
      JOIN centers c ON lower(regexp_replace(COALESCE(c.subdomain,''),'\.eduka\.uz$',''))=lower(regexp_replace(a.tenant,'\.eduka\.uz$',''))
    ON CONFLICT (group_id,student_id,lesson_date) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
