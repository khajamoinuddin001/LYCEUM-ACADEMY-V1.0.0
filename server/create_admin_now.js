import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    (name, email, password, role, permissions, is_verified, must_reset_password)
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