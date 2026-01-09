import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables using absolute paths
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(__dirname, '..', envFile);
dotenv.config({ path: envPath });

console.log(`📡 [Admin Setup] Loading env from ${envPath}`);

import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createAdmin() {
  const email = "admin@lyceum.com";
  const password = "admin123"; // change later
  const name = "Admin";

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    console.log("⚠️ Admin already exists");
    process.exit(0);
  }

  await pool.query(
    `
    INSERT INTO users 
    (name, email, password, role, permissions, is_verified, "mustResetPassword")
    VALUES
    ($1, $2, $3, 'Admin', '{}', true, false)
    `,
    [name, email, hashedPassword]
  );

  console.log("✅ ADMIN CREATED");
  console.log("📧 Email:", email);
  console.log("🔑 Password:", password);

  process.exit(0);
}

createAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});