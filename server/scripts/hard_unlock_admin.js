import { query, initDatabase } from '../database.js';
import '../load_env.js';

async function run() {
    try {
        const targetEmail = process.argv[2] || 'admin@lyceum.com';
        console.log(`🚀 Starting Hard Unlock for ${targetEmail}...`);
        await initDatabase();
        
        const fallbackOtp = '000000';
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        const result = await query(`
            UPDATE users 
            SET is_locked = false, 
                failed_login_attempts = 0, 
                unlock_otp = $1, 
                unlock_otp_expires_at = $2 
            WHERE email = $3 
            RETURNING id, email
        `, [fallbackOtp, expiry, targetEmail.toLowerCase()]);

        if (result.rows.length > 0) {
            console.log(`\n✅ SUCCESS!`);
            console.log(`👤 User: ${result.rows[0].email} (ID: ${result.rows[0].id})`);
            console.log(`🔓 Status: UNLOCKED`);
            console.log(`🔑 Fallback Code: ${fallbackOtp}`);
            console.log(`⏰ Code Expiry: ${expiry.toLocaleString()}`);
        } else {
            console.error(`\n❌ ERROR: User '${targetEmail}' not found in the database.`);
            console.log(`ℹ️ Tip: Run with 'node scripts/hard_unlock_admin.js <email>'`);
        }
    } catch (err) {
        console.error(`\n❌ CRITICAL ERROR:`, err.message);
    } finally {
        console.log("\n👋 Exiting...");
        process.exit();
    }
}

run();
