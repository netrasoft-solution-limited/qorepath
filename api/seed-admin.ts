import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npx ts-node seed-admin.ts
// Set DATABASE_URL to seed a hosted database (e.g. Neon); otherwise the DB_* settings are used.
const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@qorepath.com';
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain || plain.length < 8) {
    throw new Error('Set ADMIN_PASSWORD (at least 8 characters) to create the admin account.');
  }

  await ds.initialize();

  const existing = await ds.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.length > 0) {
    console.log('Admin already exists:', email);
    await ds.destroy();
    return;
  }

  const password = await bcrypt.hash(plain, 10);
  const adminPerms = 'cohorts,enrollments,payments,at_risk,instructors,graduation,certificates,revenue,reports,settings,users,audit_log';
  await ds.query(
    `INSERT INTO users ("firstName", "lastName", email, password, role, permissions)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    ['Super', 'Admin', email, password, 'admin', adminPerms],
  );

  console.log('✅ Admin created:', email);
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
