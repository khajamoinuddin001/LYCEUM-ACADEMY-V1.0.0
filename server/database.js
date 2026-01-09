import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute paths for env loading - critical for VPS/PM2
const envPath = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? '.env.production' : '.env');
dotenv.config({ path: envPath });

console.log(`📡 Database utility: loading env from ${envPath}`);

const { Pool } = pg;

let pool = null;

export async function initDatabase() {
  console.log("📡 Database utility: starting connection pool");

  if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL is not defined in environment!");
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const client = await pool.connect();
  try {
    console.log("✅ Connected to PostgreSQL database");
    await client.query("BEGIN");

    // USERS
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Admin', 'Staff', 'Student')),
        permissions JSONB DEFAULT '{}',
        must_reset_password BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        verification_token TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // CONTACTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        "contactId" TEXT,
        email TEXT,
        phone TEXT,
        department TEXT,
        major TEXT,
        notes TEXT,
        "fileStatus" TEXT,
        "agentAssigned" TEXT,
        checklist JSONB DEFAULT '[]',
        "activityLog" JSONB DEFAULT '[]',
        "recordedSessions" JSONB DEFAULT '[]',
        documents JSONB DEFAULT '[]',
        "visaInformation" JSONB DEFAULT '{}',
        "lmsProgress" JSONB DEFAULT '{}',
        "lmsNotes" JSONB DEFAULT '{}',
        gpa REAL,
        advisor TEXT,
        courses JSONB DEFAULT '[]',
        street1 TEXT,
        street2 TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        country TEXT,
        gstin TEXT,
        pan TEXT,
        tags TEXT,
        "visaType" TEXT,
        "countryOfApplication" TEXT,
        source TEXT,
        "contactType" TEXT,
        stream TEXT,
        intake TEXT,
        "counselorAssigned" TEXT,
        "applicationEmail" TEXT,
        "applicationPassword" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // LEADS
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        value REAL NOT NULL,
        contact TEXT NOT NULL,
        stage TEXT NOT NULL CHECK(stage IN ('New', 'Qualified', 'Proposal', 'Won', 'Lost')),
        email TEXT,
        phone TEXT,
        source TEXT,
        "assignedTo" TEXT,
        notes TEXT,
        quotations JSONB DEFAULT '[]',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK(type IN ('Invoice', 'Bill', 'Payment')),
        status TEXT NOT NULL CHECK(status IN ('Paid', 'Pending', 'Overdue')),
        amount REAL NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        start TIMESTAMP NOT NULL,
        "end" TIMESTAMP NOT NULL,
        color TEXT NOT NULL CHECK(color IN ('blue', 'green', 'purple', 'red')),
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        "dueDate" TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('todo', 'inProgress', 'done')),
        "userId" INTEGER REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Channels table
    await client.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('public', 'private', 'dm')),
        members JSONB DEFAULT '[]',
        messages JSONB DEFAULT '[]',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_percentage REAL NOT NULL,
        is_active BOOLEAN DEFAULT true,
        applicable_course_ids JSONB DEFAULT '[]'
      )
    `);

    // LMS Courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        instructor TEXT,
        price REAL,
        modules JSONB DEFAULT '[]',
        discussions JSONB DEFAULT '[]',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Visitors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        host TEXT NOT NULL,
        "scheduledCheckIn" TIMESTAMP,
        "checkIn" TIMESTAMP,
        "checkOut" TIMESTAMP,
        status TEXT NOT NULL CHECK(status IN ('Scheduled', 'Checked-in', 'Checked-out')),
        "cardNumber" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quotation Templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotation_templates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        "lineItems" JSONB DEFAULT '[]',
        total REAL DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activity Log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "adminName" TEXT NOT NULL,
        action TEXT NOT NULL
      )
    `);

    // Payment Activity Log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_activity_log (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        text TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('invoice_created', 'payment_received'))
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        "linkTo" JSONB DEFAULT '{}',
        "recipientUserIds" JSONB DEFAULT '[]',
        "recipientRoles" JSONB DEFAULT '[]'
      )
    `);

    // Documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        content BYTEA NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Videos table for recorded sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        session_id BIGINT NOT NULL UNIQUE,
        content BYTEA NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query("COMMIT");
    console.log("✅ Database schema initialized successfully");
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Database init failed:", err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

export function query(text, params) {
  if (!pool) throw new Error("Database not initialized");
  return pool.query(text, params);
}

export async function getClient() {
  if (!pool) throw new Error("Database not initialized");
  return pool.connect();
}

export async function closePool() {
  if (pool) {
    await pool.end();
    console.log("Database pool closed");
  }
}

export default {
  initDatabase,
  query,
  getClient,
  closePool
};