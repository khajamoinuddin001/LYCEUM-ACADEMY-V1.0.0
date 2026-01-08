#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * This script creates an admin user in the PostgreSQL database.
 * Run this after deploying to create your first admin account.
 * 
 * Usage:
 *   node create-admin.js
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
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

async function createAdminUser() {
    console.log('\n🔐 Admin User Creation Script\n');
    console.log('This will create an admin user for your Lyceum Academy application.\n');

    try {
        // Get user input
        const name = await question('Enter admin name: ');
        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password: ');

        if (!name || !email || !password) {
            console.log('\n❌ All fields are required!');
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (existingUser.rows.length > 0) {
            console.log('\n⚠️  User with this email already exists!');
            const update = await question('Do you want to update this user to Admin role and reset the password? (yes/no): ');

            if (update.toLowerCase() === 'yes' || update.toLowerCase() === 'y') {
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.query('UPDATE users SET role = $1, password = $2, "mustResetPassword" = false WHERE email = $3', ['Admin', hashedPassword, email.toLowerCase()]);
                console.log('\n✅ User updated to Admin role and password reset successfully!');
            } else {
                console.log('\n❌ Operation cancelled.');
            }

            rl.close();
            pool.end();
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userResult = await pool.query(`
      INSERT INTO users (name, email, password, role, permissions, must_reset_password)
      VALUES ($1, $2, $3, 'Admin', $4, false)
      RETURNING id, name, email, role
    `, [name, email.toLowerCase(), hashedPassword, JSON.stringify({})]);

        const user = userResult.rows[0];

        // Create contact for admin
        const contactId = `LA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(user.id).padStart(3, '0')}`;

        await pool.query(`
      INSERT INTO contacts (user_id, name, email, contact_id, department, major, notes)
      VALUES ($1, $2, $3, $4, 'Administration', 'Admin', $5)
    `, [
            user.id,
            name,
            email.toLowerCase(),
            contactId,
            `Admin user created on ${new Date().toLocaleDateString()}.`
        ]);

        console.log('\n✅ Admin user created successfully!');
        console.log('\n📋 User Details:');
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Contact ID: ${contactId}`);
        console.log('\n🎉 You can now login with these credentials!');

    } catch (error) {
        console.error('\n❌ Error creating admin user:', error.message);
        process.exit(1);
    } finally {
        rl.close();
        await pool.end();
    }
}

createAdminUser();
