import '../load_env.js';
import { hashPassword } from "../auth.js";
import { query, closePool } from "../database.js";

async function createAdmin() {
  const email = "admin@lyceum.com";
  const password = "admin123"; // change later
  const name = "Admin";

  const hashedPassword = await hashPassword(password);

  const existing = await query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    console.log("⚠️ Admin already exists");
    process.exit(0);
  }

  await query(
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

  await closePool();
  process.exit(0);
}

createAdmin().catch(async err => {
  console.error(err);
  await closePool();
  process.exit(1);
});