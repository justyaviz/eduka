const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured. Set Railway PostgreSQL DATABASE_URL before running seed.");
  }

  let Pool;
  try {
    ({ Pool } = require("pg"));
  } catch {
    throw new Error("pg dependency is not installed. Run npm install before seeding.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  });

  const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schemaSql);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const org = await client.query(
      `INSERT INTO organizations (name, slug, phone, address, status, subscription_status, trial_ends_at, license_expires_at, setup_completed_at)
       VALUES ('Ilm Academy Uz','ilm-academy-uz','+998 90 123 45 67','Toshkent shahri','active','trial',NOW() + interval '7 days',NOW() + interval '30 days',NOW())
       ON CONFLICT (slug) DO UPDATE
       SET name=EXCLUDED.name, phone=EXCLUDED.phone, address=EXCLUDED.address, status='active', subscription_status='trial', setup_completed_at=NOW(), updated_at=NOW()
       RETURNING id`,
    );
    const organizationId = org.rows[0].id;

    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Eduka12345!";
    const admin = await client.query(
      `INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash, is_active)
       VALUES ($1,'Eduka Admin','admin@eduka.uz','+998 90 123 45 67','998901234567','center_admin',$2,TRUE)
       ON CONFLICT (normalized_phone) DO UPDATE
       SET organization_id=$1, full_name='Eduka Admin', email='admin@eduka.uz', role='center_admin', password_hash=$2, is_active=TRUE, updated_at=NOW()
       RETURNING id`,
      [organizationId, hashPassword(adminPassword)]
    );

    await client.query("DELETE FROM attendance_records WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM payments WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM lessons WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM subscriptions WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM group_students WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM leads WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM students WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM groups WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM teachers WHERE organization_id=$1", [organizationId]);
    await client.query("DELETE FROM courses WHERE organization_id=$1", [organizationId]);

    const courses = {};
    for (const course of [
      ["IELTS", "IELTS 6.5+ natija uchun intensiv kurs", 700000, "6 oy", "Advanced", "group"],
      ["English Beginner", "Noldan boshlovchilar uchun ingliz tili", 500000, "4 oy", "Beginner", "group"],
      ["Matematika", "Maktab va abituriyentlar uchun matematika", 450000, "5 oy", "Foundation", "group"]
    ]) {
      const inserted = await client.query(
        `INSERT INTO courses (organization_id, name, description, price, duration, level, lesson_type, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *`,
        [organizationId, ...course]
      );
      courses[course[0]] = inserted.rows[0];
    }

    const teachers = {};
    for (const teacher of [
      ["Madina Akramova", "+998 90 111 22 33", "madina@eduka.uz", "IELTS", "IELTS, Speaking", "IELTS Morning A", "fixed", 3500000],
      ["Sardor Karimov", "+998 91 222 33 44", "sardor@eduka.uz", "English Beginner", "Grammar, Beginner", "Beginner Evening", "per_lesson", 90000],
      ["Dilshod Rasulov", "+998 93 333 44 55", "dilshod@eduka.uz", "Matematika", "Algebra, Geometriya", "Math Foundation", "percentage", 35]
    ]) {
      const inserted = await client.query(
        `INSERT INTO teachers (organization_id, full_name, phone, email, course_name, subjects, groups, login_enabled, status, salary_type, salary_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,'active',$8,$9) RETURNING *`,
        [organizationId, ...teacher]
      );
      teachers[teacher[3]] = inserted.rows[0];
    }

    const groups = {};
    for (const group of [
      ["IELTS Morning A", "IELTS", teachers.IELTS.id, teachers.IELTS.full_name, "Dushanba, Chorshanba, Juma", "09:00", "10:30", 700000, "2-xona"],
      ["Beginner Evening", "English Beginner", teachers["English Beginner"].id, teachers["English Beginner"].full_name, "Seshanba, Payshanba, Shanba", "18:00", "19:30", 500000, "4-xona"],
      ["Math Foundation", "Matematika", teachers.Matematika.id, teachers.Matematika.full_name, "Dushanba, Chorshanba", "16:00", "17:30", 450000, "1-xona"]
    ]) {
      const inserted = await client.query(
        `INSERT INTO groups (organization_id, name, course_name, teacher_id, teacher_name, days, start_time, end_time, monthly_price, starts_at, room, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_DATE,$10,'active') RETURNING *`,
        [organizationId, ...group]
      );
      groups[group[0]] = inserted.rows[0];
    }

    const students = [];
    for (const student of [
      ["Ali Valiyev", "+998 99 893 99 99", "+998 90 222 33 44", "IELTS", groups["IELTS Morning A"].id, "active", "Motivatsiyasi yuqori"],
      ["Sevara Karimova", "+998 90 444 55 66", "+998 91 777 88 99", "IELTS", groups["IELTS Morning A"].id, "debtor", "Qarzdorlik eslatmasi kerak"],
      ["Jasur Tursunov", "+998 93 123 45 67", "+998 94 765 43 21", "English Beginner", groups["Beginner Evening"].id, "active", "Sinovdan keyin qoldi"],
      ["Malika Sobirova", "+998 95 555 66 77", "+998 97 888 99 00", "Matematika", groups["Math Foundation"].id, "active", "Yangi talaba"]
    ]) {
      const inserted = await client.query(
        `INSERT INTO students (organization_id, full_name, phone, parent_phone, course_name, group_id, payment_type, status, note)
         VALUES ($1,$2,$3,$4,$5,$6,'monthly',$7,$8) RETURNING *`,
        [organizationId, ...student]
      );
      students.push(inserted.rows[0]);
      await client.query(
        `INSERT INTO group_students (organization_id, group_id, student_id)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [organizationId, inserted.rows[0].group_id, inserted.rows[0].id]
      );
    }

    const studentByName = Object.fromEntries(students.map((student) => [student.full_name, student]));
    for (const payment of [
      [studentByName["Ali Valiyev"], groups["IELTS Morning A"], "2026-05", 700000, 700000, 0, "paid", "naqd"],
      [studentByName["Sevara Karimova"], groups["IELTS Morning A"], "2026-05", 700000, 350000, 0, "partial", "click"],
      [studentByName["Jasur Tursunov"], groups["Beginner Evening"], "2026-05", 500000, 0, 0, "debt", "payme"],
      [studentByName["Malika Sobirova"], groups["Math Foundation"], "2026-05", 450000, 450000, 50000, "paid", "karta"]
    ]) {
      await client.query(
        `INSERT INTO payments (organization_id, student_id, group_id, payment_month, due_amount, amount, discount, status, payment_type, note, created_by, paid_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Seed demo tolov',$10,NOW())`,
        [organizationId, payment[0].id, payment[1].id, payment[2], payment[3], payment[4], payment[5], payment[6], payment[7], admin.rows[0].id]
      );
    }

    await client.query(
      `WITH balances AS (
        SELECT student_id, GREATEST(COALESCE(SUM(COALESCE(due_amount, 0) - COALESCE(amount, 0) - COALESCE(discount, 0)), 0), 0)::numeric AS balance
        FROM payments
        WHERE organization_id=$1 AND status <> 'cancelled'
        GROUP BY student_id
      )
      UPDATE students s
      SET balance=balances.balance,
          status=CASE WHEN balances.balance > 0 THEN 'debtor' ELSE 'active' END
      FROM balances
      WHERE s.organization_id=$1 AND s.id=balances.student_id`,
      [organizationId]
    );

    for (const student of students) {
      await client.query(
        `INSERT INTO attendance_records (organization_id, group_id, student_id, lesson_date, status, note, marked_by)
         VALUES ($1,$2,$3,CURRENT_DATE,$4,'Seed davomat',$5)
         ON CONFLICT (organization_id, group_id, student_id, lesson_date)
         DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note, marked_by=EXCLUDED.marked_by`,
        [organizationId, student.group_id, student.id, student.full_name === "Jasur Tursunov" ? "late" : "present", admin.rows[0].id]
      );
    }

    await client.query(
      `INSERT INTO leads (organization_id, full_name, phone, course_name, status, source, manager_name, next_contact_at, note)
       VALUES
       ($1,'Bekzod Olimov','+998 95 222 11 00','IELTS','new','Instagram','Admin',NOW() + interval '2 hours','IELTS bilan qiziqdi'),
       ($1,'Dilnoza Rahimova','+998 97 333 22 11','English Beginner','trial','Telegram bot','Admin',NOW() + interval '1 day','Sinov darsga yozildi'),
       ($1,'Oybek Xamidov','+998 94 222 11 44','Matematika','contacted','Website','Manager',NOW() + interval '3 days','Qayta aloqa kerak')`,
      [organizationId]
    );

    for (const group of Object.values(groups)) {
      await client.query(
        "INSERT INTO lessons (organization_id, group_id, lesson_at, status) VALUES ($1,$2,NOW() + interval '3 hours','planned')",
        [organizationId, group.id]
      );
    }

    const existingTariff = await client.query("SELECT id FROM tariffs WHERE name='Pro' ORDER BY id DESC LIMIT 1");
    const tariffId = existingTariff.rows[0]?.id || (await client.query(
      "INSERT INTO tariffs (name, monthly_price, student_limit, teacher_limit, branch_limit) VALUES ('Pro', 199000, 500, 20, 3) RETURNING id"
    )).rows[0].id;
    if (tariffId) {
      await client.query(
        `INSERT INTO subscriptions (organization_id, tariff_id, status, starts_at, ends_at)
         VALUES ($1,$2,'trial',NOW(),NOW() + interval '30 days')`,
        [organizationId, tariffId]
      );
    }

    await client.query("COMMIT");
    console.log("Seed completed");
    console.log("Login: +998901234567");
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
