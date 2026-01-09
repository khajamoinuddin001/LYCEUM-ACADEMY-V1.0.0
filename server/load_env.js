import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const envFile = isProd ? '.env.production' : '.env';

// Load from the server directory (where load_env.js is)
dotenv.config({ path: path.resolve(__dirname, envFile) });

console.log(`📡 [Env] Loaded ${envFile} in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

if (isProd && !process.env.JWT_SECRET) {
    console.warn('⚠️  [Env] WARNING: JWT_SECRET is not defined in .env.production!');
}

export default {
    isProd,
    envFile
};
