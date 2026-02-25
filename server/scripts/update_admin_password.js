import '../load_env.js';
import { hashPassword } from "../auth.js";
import { query, closePool, initDatabase } from "../database.js";

async function updatePassword() {
    await initDatabase();
    const email = "admin@lyceum.com";
    const password = "admin123";

    const hashedPassword = await hashPassword(password);

    const existing = await query(
        "SELECT id FROM users WHERE email = $1",
        [email]
    );

    if (existing.rows.length === 0) {
        console.log("⚠️ Admin does not exist");
        process.exit(0);
    }

    await query(
        `
    UPDATE users 
    SET password = $1
    WHERE email = $2
    `,
        [hashedPassword, email]
    );

    console.log("✅ PASSWORD UPDATED");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);

    await closePool();
    process.exit(0);
}

updatePassword().catch(async err => {
    console.error(err);
    await closePool();
    process.exit(1);
});
