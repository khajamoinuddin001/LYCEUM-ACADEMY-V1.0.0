import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Determine which env file to load
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(__dirname, envFile);

console.log(`📡 [Env] Attempting to load environment from: ${envPath}`);

// 2. Check if file exists
if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  [Env] Warning: Environment file not found at ${envPath}`);
    // In development, this might be okay if using defaults, but in production it's usually fatal
} else {
    // 3. Load the environment file
    const result = dotenv.config({ path: envPath });

    if (result.error) {
        console.error(`❌ [Env] Error parsing ${envFile}:`, result.error);
    } else {
        console.log(`✅ [Env] Successfully loaded ${envFile}`);
    }
}

// 4. Validate critical variables
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`❌ [Env] Critical error: Missing environment variables: ${missingVars.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
        console.error(`🚨 [Env] In production mode, these variables are MANDATORY. The server may fail to start.`);
    }
} else {
    console.log(`✅ [Env] All critical environment variables are present.`);
}

export default process.env;
