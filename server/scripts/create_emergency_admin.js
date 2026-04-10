import { query, initDatabase } from '../database.js';
import { hashPassword } from '../auth.js';
import '../load_env.js';

async function run() {
    try {
        const adminEmail = 'admin@lyceumacad.com';
        const adminName = 'Emergency Admin';
        const rawPassword = 'admin123';

        const ODOO_APPS = [
            'dashboard', 'Contacts', 'LMS', 'CRM', 'Calendar', 'Discuss',
            'Accounts', 'Analytics', 'Tasks', 'Tickets', 'Reception',
            'Settings', 'Access Control', 'Visitor Display', 'Department Dashboard',
            'Attendance & Payroll', 'University Application', 'Visa Operations', 'University Manager',
            'Live Session Monitor', 'Automation Engine', 'Document manager', 'Announcements', 'Mock Interview', 'Employee Performance'
        ];

        console.log(`🚀 Starting Emergency Admin Creation for ${adminEmail}...`);
        await initDatabase();
        
        // Prepare full permissions
        const fullPerms = {};
        for (const app of ODOO_APPS) {
            fullPerms[app] = { read: true, create: true, update: true, delete: true };
        }

        // Check if user already exists
        const check = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (check.rows.length > 0) {
            console.log(`\nℹ️ INFO: User '${adminEmail}' already exists (ID: ${check.rows[0].id}).`);
            // Update permissions just in case
            await query('UPDATE users SET permissions = $1, role = $2 WHERE id = $3', [JSON.stringify(fullPerms), 'Admin', check.rows[0].id]);
            console.log(`✅ Permissions synchronized for existing user.`);
            console.log(`   If you need to unlock this user, run: 'node scripts/hard_unlock_admin.js ${adminEmail}'`);
            process.exit();
        }

        const hashedPassword = await hashPassword(rawPassword);

        const result = await query(`
            INSERT INTO users (name, email, password, role, permissions, is_verified, must_reset_password)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, role
        `, [adminName, adminEmail, hashedPassword, 'Admin', JSON.stringify(fullPerms), true, true]);

        if (result.rows.length > 0) {
            console.log(`\n✅ SUCCESS!`);
            console.log(`👤 User: ${result.rows[0].email} (ID: ${result.rows[0].id})`);
            console.log(`🛡️ Role: ${result.rows[0].role}`);
            console.log(`🔑 Temp Password: ${rawPassword}`);
            console.log(`📝 Note: The account is set to require a password reset on first login.`);
        } else {
            console.error(`\n❌ ERROR: Failed to create the admin account.`);
        }
    } catch (err) {
        console.error(`\n❌ CRITICAL ERROR:`, err.message);
    } finally {
        console.log("\n👋 Exiting...");
        process.exit();
    }
}

run();
