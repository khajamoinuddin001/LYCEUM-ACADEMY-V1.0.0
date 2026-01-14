import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Helper for migrations
    const migrateColumn = async (table, oldName, newName) => {
      if (oldName === newName) return;
      const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, oldName]);
      if (res.rows.length > 0) {
        console.log(`📡 [Migration] Renaming ${table}.${oldName} -> ${newName}`);
        await client.query(`ALTER TABLE "${table}" RENAME COLUMN "${oldName}" TO "${newName}"`);
      }
    };

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('users', 'createdAt', 'created_at');

    // CONTACTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        contact_id TEXT,
        email TEXT,
        phone TEXT,
        department TEXT,
        major TEXT,
        notes TEXT,
        file_status TEXT,
        agent_assigned TEXT,
        checklist JSONB DEFAULT '[]',
        activity_log JSONB DEFAULT '[]',
        recorded_sessions JSONB DEFAULT '[]',
        documents JSONB DEFAULT '[]',
        visa_information JSONB DEFAULT '{}',
        lms_progress JSONB DEFAULT '{}',
        lms_notes JSONB DEFAULT '{}',
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
        visa_type TEXT,
        country_of_application TEXT,
        source TEXT,
        contact_type TEXT,
        stream TEXT,
        intake TEXT,
        counselor_assigned TEXT,
        application_email TEXT,
        application_password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('contacts', 'userId', 'user_id');
    await migrateColumn('contacts', 'contactId', 'contact_id');
    await migrateColumn('contacts', 'fileStatus', 'file_status');
    await migrateColumn('contacts', 'agentAssigned', 'agent_assigned');
    await migrateColumn('contacts', 'activityLog', 'activity_log');
    await migrateColumn('contacts', 'recordedSessions', 'recorded_sessions');
    await migrateColumn('contacts', 'visaInformation', 'visa_information');
    await migrateColumn('contacts', 'lmsProgress', 'lms_progress');
    await migrateColumn('contacts', 'lmsNotes', 'lms_notes');
    await migrateColumn('contacts', 'visaType', 'visa_type');
    await migrateColumn('contacts', 'countryOfApplication', 'country_of_application');
    await migrateColumn('contacts', 'contactType', 'contact_type');
    await migrateColumn('contacts', 'counselorAssigned', 'counselor_assigned');
    await migrateColumn('contacts', 'applicationEmail', 'application_email');
    await migrateColumn('contacts', 'applicationPassword', 'application_password');
    await migrateColumn('contacts', 'createdAt', 'created_at');

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
        assigned_to TEXT,
        notes TEXT,
        quotations JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('leads', 'assignedTo', 'assigned_to');
    await migrateColumn('leads', 'createdAt', 'created_at');

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK(type IN ('Invoice', 'Bill', 'Payment')),
        status TEXT NOT NULL CHECK(status IN ('Paid', 'Pending', 'Overdue')),
        amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('transactions', 'customerName', 'customer_name');
    await migrateColumn('transactions', 'createdAt', 'created_at');

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        start TIMESTAMP NOT NULL,
        "end" TIMESTAMP NOT NULL,
        color TEXT NOT NULL CHECK(color IN ('blue', 'green', 'purple', 'red')),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('events', 'createdAt', 'created_at');

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('todo', 'inProgress', 'done')),
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('tasks', 'dueDate', 'due_date');
    await migrateColumn('tasks', 'userId', 'user_id');
    await migrateColumn('tasks', 'createdAt', 'created_at');

    // Visitors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id),
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        host TEXT NOT NULL,
        purpose TEXT,
        scheduled_check_in TIMESTAMP,
        check_in TIMESTAMP,
        check_out TIMESTAMP,
        check_out TIMESTAMP,
        status TEXT NOT NULL CHECK(status IN ('Scheduled', 'Checked-in', 'Checked-out')),
        card_number TEXT,
        daily_sequence_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('visitors', 'scheduledCheckIn', 'scheduled_check_in');
    await migrateColumn('visitors', 'checkIn', 'check_in');
    await migrateColumn('visitors', 'checkOut', 'check_out');
    await migrateColumn('visitors', 'cardNumber', 'card_number');
    await migrateColumn('visitors', 'createdAt', 'created_at');

    // Manual column additions for existing tables
    try {
      await client.query('ALTER TABLE visitors ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id)');
      await client.query('ALTER TABLE visitors ADD COLUMN IF NOT EXISTS purpose TEXT');
      await client.query('ALTER TABLE visitors ADD COLUMN IF NOT EXISTS daily_sequence_number INTEGER');
      await client.query('ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visit_segments JSONB DEFAULT \'[]\'');
    } catch (e) {
      console.log('Columns contact_id/purpose/daily_sequence_number might already exist');
    }

    // Quotation Templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotation_templates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        line_items JSONB DEFAULT '[]',
        total REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('quotation_templates', 'lineItems', 'line_items');
    await migrateColumn('quotation_templates', 'createdAt', 'created_at');

    // Activity Log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin_name TEXT NOT NULL,
        action TEXT NOT NULL
      )
    `);
    await migrateColumn('activity_log', 'adminName', 'admin_name');

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        link_to JSONB DEFAULT '{}',
        recipient_user_ids JSONB DEFAULT '[]',
        recipient_roles JSONB DEFAULT '[]'
      )
    `);
    await migrateColumn('notifications', 'linkTo', 'link_to');
    await migrateColumn('notifications', 'recipientUserIds', 'recipient_user_ids');
    await migrateColumn('notifications', 'recipientRoles', 'recipient_roles');

    // Channels table (ensure createdAt)
    await client.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('public', 'private', 'dm')),
        members JSONB DEFAULT '[]',
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('channels', 'createdAt', 'created_at');

    // Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_percentage REAL NOT NULL,
        is_active BOOLEAN DEFAULT true,
        applicable_course_ids JSONB DEFAULT '[]'
      )
    `);

    // LMS Courses (ensure createdAt)
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        instructor TEXT,
        price REAL,
        modules JSONB DEFAULT '[]',
        discussions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('lms_courses', 'createdAt', 'created_at');

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

    // Password Reset Tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('password_reset_tokens', 'expiresAt', 'expires_at');
    await migrateColumn('password_reset_tokens', 'createdAt', 'created_at');

    await client.query("COMMIT");
    // ATTENDANCE & PAYROLL
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        check_in TIMESTAMP,
        check_out TIMESTAMP,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns to users if they don't exist
    const userColumns = ['joining_date', 'base_salary', 'shift_start', 'shift_end'];
    for (const col of userColumns) {
      const checkCol = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = $1
      `, [col]);

      if (checkCol.rows.length === 0) {
        let type = 'TEXT';
        if (col === 'base_salary') type = 'NUMERIC';
        if (col === 'joining_date') type = 'DATE';
        console.log(`📡 Adding column ${col} to users table`);
        await client.query(`ALTER TABLE users ADD COLUMN ${col} ${type}`);
      }
    }

    console.log("✅ Database initialized successfully");
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