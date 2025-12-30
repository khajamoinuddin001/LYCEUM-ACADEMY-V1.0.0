
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function resetAdmin() {
    console.log('Resetting/Creating admin user...');

    const email = 'admin@lyceum.com';
    const password = 'admin123'; // Simple password for local dev
    const name = 'System Admin';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (check.rows.length > 0) {
            await pool.query('UPDATE users SET password = $1, role = $2 WHERE email = $3',
                [hashedPassword, 'Admin', email]);
            console.log('Updated existing user admin@lyceum.com');
        } else {
            const res = await pool.query(`
                INSERT INTO users (name, email, password, role, permissions, must_reset_password)
                VALUES ($1, $2, $3, 'Admin', $4, false)
                RETURNING id`,
                [name, email, hashedPassword, '{}']);

            const userId = res.rows[0].id;
            const contactId = `LA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(userId).padStart(3, '0')}`;

            // Create contact too
            await pool.query(`
                INSERT INTO contacts (user_id, name, email, contact_id, department, major, notes)
                VALUES ($1, $2, $3, $4, 'Administration', 'Admin', $5)
            `, [userId, name, email, contactId, 'Created via reset script']);

            console.log('Created new user admin@lyceum.com');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

resetAdmin();
