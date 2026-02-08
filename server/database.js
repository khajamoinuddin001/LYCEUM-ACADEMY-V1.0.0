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
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Admin', 'Staff', 'Student')),
        permissions JSONB DEFAULT '{}',
        must_reset_password BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        verification_token TEXT,
        google_id TEXT UNIQUE,
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
    await migrateColumn('contacts', 'applicationPassword', 'application_password');
    await migrateColumn('contacts', 'createdAt', 'created_at');
    // Ensure metadata column exists
    await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'');

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
        contact_id INTEGER REFERENCES contacts(id),
        customer_name TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK(type IN ('Invoice', 'Bill', 'Payment')),
        status TEXT NOT NULL CHECK(status IN ('Paid', 'Pending', 'Overdue')),
        amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tickets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        ticket_id TEXT UNIQUE NOT NULL,
        contact_id INTEGER REFERENCES contacts(id),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
        priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
        assigned_to INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        category TEXT,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        assigned_to INTEGER REFERENCES users(id),
        assigned_by INTEGER REFERENCES users(id),
        priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
        replies JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('tasks', 'dueDate', 'due_date');
    await migrateColumn('tasks', 'userId', 'assigned_to');
    await migrateColumn('tasks', 'assignedTo', 'assigned_to');
    await migrateColumn('tasks', 'assignedBy', 'assigned_by');
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
        status TEXT NOT NULL CHECK(status IN ('Scheduled', 'Checked-in', 'Checked-out', 'Called')),
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
      await client.query('ALTER TABLE visitors ADD COLUMN IF NOT EXISTS called_at TIMESTAMP');
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id)');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id)');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id)');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT \'Medium\'');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES users(id)');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_id TEXT UNIQUE');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT \'[]\'');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id)');
      // Add due_date column to transactions if it doesn't exist
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_date TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS activity_type TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_visible_to_student BOOLEAN DEFAULT false');

      // Task Time Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS task_time_logs (
          id SERIAL PRIMARY KEY,
          task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
          assigned_to INTEGER REFERENCES users(id),
          start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          end_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Generate task_id for existing tasks that don't have one
      await client.query(`
        UPDATE tasks 
        SET task_id = 'TSK-' || LPAD((FLOOR(RANDOM() * 90000) + 10000)::TEXT, 5, '0')
        WHERE task_id IS NULL
      `);
      await client.query('ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false');
      await client.query('ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT');
      await client.query('ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category TEXT');

      // Avatar DB Storage Support
      await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_data BYTEA');
      await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_mimetype TEXT');

      // Fix transactions for Transfers
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT');
      try {
        await client.query('SAVEPOINT fix_constraint_sp');
        // Drop old constraint and add new one allowing all used types
        await client.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check');
        // Broaden the check to include 'Purchase', 'Expense', 'Income' as defined in types.ts and used in app
        await client.query("ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('Invoice', 'Bill', 'Payment', 'Transfer', 'Purchase', 'Expense', 'Income'))");
        await client.query('RELEASE SAVEPOINT fix_constraint_sp');
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT fix_constraint_sp');
        console.log('Note: Could not update transactions_type_check constraint (ignoring error to keep DB init alive). Details:', err.message);
      }

    } catch (e) {
      console.log('Columns might already exist');
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

    // Fix notifications.read column type (migrating from integer to boolean if needed)
    const checkReadType = await client.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'read'
    `);
    if (checkReadType.rows.length > 0 && checkReadType.rows[0].data_type === 'integer') {
      console.log('📡 Migrating notifications.read column from integer to boolean');
      // 1. Drop existing default to avoid casting errors
      await client.query('ALTER TABLE notifications ALTER COLUMN read DROP DEFAULT');

      // 2. Convert column type with explicit casting logic
      await client.query(`
        ALTER TABLE notifications 
        ALTER COLUMN read TYPE BOOLEAN 
        USING CASE WHEN read::integer = 1 THEN true ELSE false END
      `);

      // 3. Set new boolean default
      await client.query('ALTER TABLE notifications ALTER COLUMN read SET DEFAULT false');
    }

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

    // Channel Attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_attachments (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        content_type TEXT,
        file_data BYTEA,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // LEAVE REQUESTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
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



    // Add working_days column separately
    try {
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS working_days JSONB DEFAULT \'[]\'');
    } catch (e) {
      console.log('Working days column might already exist');
    }

    // Add phone column separately if it doesn't exist
    try {
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT');
    } catch (e) {
      console.log('Phone column might already exist');
    }

    // SYSTEM SETTINGS (for Office Location etc)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB
      )
    `);

    // VENDORS
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        gstin TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PRODUCTS (Inventory)
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // EXPENSE PAYEES
    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_payees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        default_category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
};// trigger reload 1770196699
