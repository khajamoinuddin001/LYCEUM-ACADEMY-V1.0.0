import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const ODOO_APPS = [
    'dashboard', 'Contacts', 'LMS', 'CRM', 'Calendar', 'Discuss',
    'Accounts', 'Analytics', 'Tasks', 'Tickets', 'Reception',
    'Settings', 'Access Control', 'Visitor Display', 'Department Dashboard',
    'Attendance', 'University Application', 'Visa Operations', 'University Manager',
    'Live Session Monitor', 'Automation Engine', 'Document manager', 'Announcements'
];

async function run() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Attempt to find the master admin (trying both possible emails)
        let masterAdminRes = await client.query("SELECT * FROM users WHERE email = 'admin@lyceum.com'");

        if (masterAdminRes.rows.length === 0) {
            console.log("⚠️ Could not find 'admin@lyceum.com', trying fallback: 'admin@lyceumacad.com'...");
            masterAdminRes = await client.query("SELECT * FROM users WHERE email = 'admin@lyceumacad.com'");
        }

        if (masterAdminRes.rows.length === 0) {
            console.log("❌ Error: Could not find either 'admin@lyceum.com' or 'admin@lyceumacad.com'!");
            await client.query("ROLLBACK");
            return;
        }

        const masterAdmin = masterAdminRes.rows[0];
        const fullPerms = {};
        for (const app of ODOO_APPS) {
            fullPerms[app] = { read: true, create: true, update: true, delete: true };
        }

        // Give full access to the master admin
        await client.query("UPDATE users SET permissions = $1 WHERE id = $2", [JSON.stringify(fullPerms), masterAdmin.id]);

        await client.query("COMMIT");
        console.log(`✅ Successfully granted ALL application permissions to: ${masterAdmin.email}`);
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("Error updating permissions:", e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
