#!/usr/bin/env node

/**
 * Manual User Verification Script
 * 
 * This script manually marks a user as verified in the database.
 * Useful when SMTP is not set up or for unblocking users locally.
 * 
 * Usage:
 *   node server/verify-user.js
 */

import pg from 'pg';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, envFile) });


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

async function verifyUser() {
    console.log('\n✅ Manual User Verification Script\n');
    console.log('This will mark a user as "verified" so they can log in.\n');

    try {
        const email = await question('Enter the email of the user to verify: ');

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

        if (user.is_verified) {
            console.log(`\n⚠️  User '${user.name}' (${user.email}) is ALREADY verified.`);
        } else {
            await pool.query('UPDATE users SET is_verified = true, verification_token = null WHERE id = $1', [user.id]);
            console.log(`\n🎉 Success! User '${user.name}' (${user.email}) has been verified.`);
            console.log('They should be able to log in now.');
        }

    } catch (error) {
        console.error('\n❌ Error verifying user:', error.message);
    } finally {
        rl.close();
        await pool.end();
    }
}

verifyUser();
