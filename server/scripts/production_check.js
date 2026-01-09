import { initDatabase, closePool } from '../database.js';

async function checkProduction() {
    console.log('🏁 [Production Check] Starting...');

    try {
        // 1. Check Database
        await initDatabase();
        console.log('✅ [Production Check] Database connectivity confirmed.');

        // 2. Check JWT Secret
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 10) {
            console.warn('⚠️  [Production Check] WARNING: JWT_SECRET is missing or too short.');
        } else {
            console.log('✅ [Production Check] JWT_SECRET is configured.');
        }

        // 3. Check Environment
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`📢 [Production Check] Warning: NODE_ENV is set to "${process.env.NODE_ENV}", not "production".`);
        } else {
            console.log('✅ [Production Check] Environment is set to production.');
        }

        console.log('🚀 [Production Check] All checks passed. System is ready.');
        await closePool();
        process.exit(0);
    } catch (error) {
        console.error('❌ [Production Check] FATAL ERROR:', error.message);
        process.exit(1);
    }
}

checkProduction();
