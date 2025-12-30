#!/usr/bin/env node

/**
 * Promote User to Admin Script
 * 
 * This script promotes an existing user to the Admin role.
 * 
 * Usage:
 *   node server/promote-user.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: 'server/.env' });
if (!process.env.DATABASE_URL) {
    dotenv.config();
}

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function promoteUser() {
    console.log('\n👑 Promote User to Admin Script\n');
    console.log('This will grant Administrator privileges to a user.\n');

    try {
        const email = await question('Enter the email of the user to promote: ');

        if (!email) {
            console.log('\n❌ Email is required!');
            process.exit(1);
        }

        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (userResult.rows.length === 0) {
            console.log('\n❌ User not found!');
            rl.close();
            pool.end();
            return;
        }

        const user = userResult.rows[0];

        if (user.role === 'Admin') {
            console.log(`\n⚠️  User '${user.name}' (${user.email}) is ALREADY an Admin.`);
        } else {
            // Confirm action
            const confirm = await question(`Are you sure you want to promote '${user.name}' to Admin? (yes/no): `);
            if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
                // Update role to Admin and reset permissions to empty object (Admins have implicit full access)
                await pool.query('UPDATE users SET role = $1, permissions = $2 WHERE id = $3', ['Admin', '{}', user.id]);
                console.log(`\n🎉 Success! User '${user.name}' (${user.email}) is now an Admin.`);
            } else {
                console.log('\n❌ Operation cancelled.');
            }
        }

    } catch (error) {
        console.error('\n❌ Error promoting user:', error.message);
    } finally {
        rl.close();
        await pool.end();
    }
}

promoteUser();
