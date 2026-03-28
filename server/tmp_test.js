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

async function query(text, params) {
    const res = await pool.query(text, params);
    return res;
}

async function run() {
    console.log("Checking staff_performance_records table structure...");
    
    const colCheck = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'staff_performance_records'
    `);
    
    console.log("Columns:", colCheck.rows.map(r => r.column_name).join(', '));
    const hasSnapshot = colCheck.rows.some(r => r.column_name === 'metrics_snapshot');
    console.log(`✅ metrics_snapshot exists: ${hasSnapshot}`);

    console.log("\nChecking for snapshots in DB...");
    const snapCheck = await query("SELECT count(*) FROM staff_performance_records WHERE metrics_snapshot IS NOT NULL");
    console.log(`📊 Snapshot Count: ${snapCheck.rows[0].count}`);

    pool.end();
}

run();
