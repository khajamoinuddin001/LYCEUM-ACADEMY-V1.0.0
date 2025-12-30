import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });
if (!process.env.DATABASE_URL) dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createTestUser() {
    const email = `testadmin${Date.now()}@lyceum.com`;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await pool.connect();
    try {
        const res = await client.query(`
            INSERT INTO users (name, email, password, role, permissions, is_verified, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email
        `, ['Test Admin', email, hashedPassword, 'Admin', '{}', true, false]);

        console.log(JSON.stringify({ email, password }));
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

createTestUser();
