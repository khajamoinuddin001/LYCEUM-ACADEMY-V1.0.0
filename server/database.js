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
    // Ensure uuid-ossp extension is enabled for uuid_generate_v4()
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
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

    // Sequences
    await client.query('CREATE SEQUENCE IF NOT EXISTS application_ack_seq START 100');

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
        is_active BOOLEAN DEFAULT true,
        performance_settings JSONB DEFAULT '{"enrolled": false, "attendance": true, "tasks": true, "reviews": true, "tickets": true}',
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
        degree TEXT,
        country_of_application TEXT,
        source TEXT,
        contact_type TEXT,
        stream TEXT,
        intake TEXT,
        counselor_assigned TEXT,
        counselor_assigned_2 TEXT,
        application_email TEXT,
        application_password TEXT,
        avatar_url TEXT,
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
    await migrateColumn('contacts', 'degree', 'degree');
    await migrateColumn('contacts', 'countryOfApplication', 'country_of_application');
    await migrateColumn('contacts', 'contactType', 'contact_type');
    await migrateColumn('contacts', 'counselorAssigned', 'counselor_assigned');
    await migrateColumn('contacts', 'applicationEmail', 'application_email');
    await migrateColumn('contacts', 'applicationPassword', 'application_password');
    await migrateColumn('contacts', 'applicationPassword', 'application_password');
    await migrateColumn('contacts', 'createdAt', 'created_at');
    // Ensure metadata column exists
    await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'');
    await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_url TEXT');
    await client.query('ALTER TABLE contacts ADD COLUMN IF NOT EXISTS degree TEXT');

    // LMS Courses
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        instructor TEXT,
        price REAL,
        modules JSONB DEFAULT '[]',
        discussions JSONB DEFAULT '[]',
        is_live BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false');

    // Class Sessions (Live classes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS class_sessions (
        id SERIAL PRIMARY KEY,
        course_id TEXT REFERENCES lms_courses(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
        current_lesson_id TEXT,
        current_slide_index INTEGER DEFAULT 0,
        current_pdf_page INTEGER DEFAULT 1,
        current_pdf_page_count INTEGER,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP
      )
    `);
    
    // Ensure existing class_sessions have all columns
    await client.query('ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
    await client.query('ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS current_lesson_id TEXT');
    await client.query('ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS current_slide_index INTEGER DEFAULT 0');
    await client.query('ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS current_pdf_page INTEGER DEFAULT 1');
    await client.query('ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS current_pdf_page_count INTEGER');

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

    // Create tickets sequence
    await client.query('CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1');

    // Ticket Attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        content_type TEXT,
        file_data BYTEA,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ticket Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
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
        assigned_to INTEGER REFERENCES users(id),
        assigned_by INTEGER REFERENCES users(id),
        priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
        replies JSONB DEFAULT '[]',
        visibility_emails JSONB DEFAULT '[]',
        recurring_task_id INTEGER,
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
        status TEXT NOT NULL CHECK(status IN ('Scheduled', 'Checked-in', 'Checked-out', 'Called')),
        card_number TEXT,
        daily_sequence_number INTEGER,
        staff_email TEXT,
        staff_name TEXT,
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
      await client.query('ALTER TABLE visitors ADD COLUMN IF NOT EXISTS staff_email TEXT');
      await client.query('ALTER TABLE visitors ADD COLUMN IF NOT EXISTS staff_name TEXT');
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id)');
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS additional_discount REAL DEFAULT 0');
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_date TEXT');
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'');
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS line_items JSONB');
      

      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id)');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT \'Medium\'');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES users(id)');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_id TEXT UNIQUE');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT \'[]\'');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id)');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS activity_type TEXT');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_visible_to_student BOOLEAN DEFAULT false');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visibility_emails JSONB DEFAULT \'[]\'');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_task_id INTEGER');
      await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL');

      // Recurring Tasks Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS recurring_tasks (
          id SERIAL PRIMARY KEY,
          task_id TEXT UNIQUE,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          frequency_days INTEGER DEFAULT 2,
          last_generated_at TIMESTAMP,
          next_generation_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          visibility_emails JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query('ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE');
      await client.query('ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL');
      try {
        await client.query('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_id_key');
        await client.query('ALTER TABLE recurring_tasks DROP CONSTRAINT IF EXISTS recurring_tasks_task_id_key');
      } catch (err) { /* ignore if not exist */ }

      // REMOVED: Re-sequencing migrations that were running on every server restart
      // These migrations were causing duplicate task IDs and should only run once during initial setup
      // If you need to re-sequence task IDs, run a one-time migration script instead

      /*
      // Re-sequence manual tasks (TSK)
      await client.query(`
        WITH sequenced AS (
          SELECT id, 
                 'TSK-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC)::TEXT, 6, '0') as new_id
          FROM tasks
          WHERE recurring_task_id IS NULL
        )
        UPDATE tasks t
        SET task_id = s.new_id
        FROM sequenced s
        WHERE t.id = s.id;
      `);

      // Re-sequence recurring definitions (REQ)
      await client.query(`
        WITH combined AS (
          SELECT id, created_at, 'definition' as source FROM recurring_tasks
          UNION ALL
          SELECT id, created_at, 'instance' as source FROM tasks WHERE recurring_task_id IS NOT NULL
        ),
        sequenced AS (
          SELECT id, source, 
                 'REQ-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC)::TEXT, 6, '0') as new_id
          FROM combined
        )
        UPDATE recurring_tasks rt
        SET task_id = s.new_id
        FROM sequenced s
        WHERE rt.id = s.id AND s.source = 'definition';
      `);
      */

      // Task instances should use TSK- prefix, not REQ-
      // The application code in api.js correctly generates TSK- IDs for task instances
      // This migration was incorrectly overriding those IDs

      // Add unique constraints back
      await client.query('ALTER TABLE tasks ADD CONSTRAINT tasks_task_id_key UNIQUE (task_id)');
      await client.query('ALTER TABLE recurring_tasks ADD CONSTRAINT recurring_tasks_task_id_key UNIQUE (task_id)');

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
      await client.query('ALTER TABLE tickets ADD COLUMN IF NOT EXISTS solved_at TIMESTAMP');
      await client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS entered_new_at TIMESTAMP');
      await client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS entered_qualified_at TIMESTAMP');
      await client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS entered_proposal_at TIMESTAMP');
      await client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS entered_won_at TIMESTAMP');
      await client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_stage_entered_at TIMESTAMP');

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
      console.log('❌ Error during manual column additions/updates:', e.message);
      // If we fail here, we should probably continue if it's just "column exists",
      // but Postgres transaction is now aborted. We MUST rollback.
      throw e;
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

    // LMS attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lms_attachments (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        content_type TEXT,
        file_data BYTEA,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // LMS Courses (ensure createdAt)

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

    // Active Sessions table (for Live Session Monitor)
    await client.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        ip_address TEXT,
        device_info TEXT,
        last_page TEXT,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_active_sessions_token_hash ON active_sessions(token_hash)');
    
    // --- OFFLINE CLASSES TABLES ---


    // Session Attendance (Automated)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_attendance (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES class_sessions(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activity Submissions (Live responses and grading)
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_submissions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES class_sessions(id) ON DELETE CASCADE,
        lesson_id TEXT,
        activity_id TEXT,
        student_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        answer JSONB NOT NULL,
        grade TEXT, -- 'correct', 'partial', 'incorrect'
        feedback TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure new columns exist in existing table
    await client.query('ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS device_info TEXT');
    await client.query('ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS last_page TEXT');

    // Session History table (Audit Log)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        ip_address TEXT,
        device_info TEXT,
        last_page TEXT,
        login_time TIMESTAMP,
        end_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT
      )
    `);

    // Token Blacklist table (for silent session termination)
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        invalidated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash)');
    
    // Internal Payment Records table (for private administrative tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS internal_payment_records (
        transaction_id TEXT PRIMARY KEY,
        internal_status TEXT CHECK (internal_status IN ('Pending', 'Approved', 'Refused')) DEFAULT 'Pending',
        notes TEXT,
        received_amount NUMERIC(15,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('ALTER TABLE internal_payment_records ADD COLUMN IF NOT EXISTS notes TEXT');
    await client.query('ALTER TABLE internal_payment_records ADD COLUMN IF NOT EXISTS received_amount NUMERIC(15,2) DEFAULT 0');
    await client.query('CREATE INDEX IF NOT EXISTS idx_internal_payment_status ON internal_payment_records(internal_status)');

    // ANNOUNCEMENTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        audience_filters JSONB DEFAULT '{}',
        send_via_email BOOLEAN DEFAULT false,
        attachments JSONB DEFAULT '[]',
        scheduled_at TIMESTAMP,
        status TEXT DEFAULT 'Delivered' CHECK (status IN ('Delivered', 'Upcoming')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience_filters JSONB DEFAULT \'{}\'');
    await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS send_via_email BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP');
    await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'Delivered\'');
    
    await client.query('UPDATE announcements SET status = \'Delivered\' WHERE status IS NULL OR status NOT IN (\'Delivered\', \'Upcoming\')');

    // Check for status constraint
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'announcements' AND constraint_name = 'announcements_status_check'
    `);
    if (constraintCheck.rows.length === 0) {
      await client.query('ALTER TABLE announcements ADD CONSTRAINT announcements_status_check CHECK (status IN (\'Delivered\', \'Upcoming\'))');
    }

    await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)');
    await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT \'[]\'');

    // ANNOUNCEMENT READS
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (announcement_id, user_id)
      )
    `);

    await client.query('ALTER TABLE announcement_reads ADD COLUMN IF NOT EXISTS announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE');
    await client.query('ALTER TABLE announcement_reads ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
    
    const pkCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'announcement_reads' AND constraint_type = 'PRIMARY KEY'
    `);
    if (pkCheck.rows.length === 0) {
      await client.query('ALTER TABLE announcement_reads ADD PRIMARY KEY (announcement_id, user_id)');
    }

    // Ensure unique constraint for ON CONFLICT (important for the mark-read route)
    const uniqueCheck = await client.query(`
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'announcement_reads' AND indexname = 'announcement_reads_unique_user_ann'
    `);
    if (uniqueCheck.rows.length === 0) {
      await client.query('ALTER TABLE announcement_reads ADD CONSTRAINT announcement_reads_unique_user_ann UNIQUE (announcement_id, user_id)');
    }

    // ANNOUNCEMENT ATTACHMENTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcement_attachments (
        id SERIAL PRIMARY KEY,
        announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        content_type TEXT,
        file_data BYTEA,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('ALTER TABLE announcement_attachments ADD COLUMN IF NOT EXISTS announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE');
    await client.query('ALTER TABLE announcement_attachments ADD COLUMN IF NOT EXISTS filename TEXT');
    await client.query('ALTER TABLE announcement_attachments ADD COLUMN IF NOT EXISTS content_type TEXT');
    await client.query('ALTER TABLE announcement_attachments ADD COLUMN IF NOT EXISTS file_data BYTEA');
    await client.query('ALTER TABLE announcement_attachments ADD COLUMN IF NOT EXISTS file_size INTEGER');

    await client.query("COMMIT");
    console.log("✅ Main tables initialized");

    // Mock Interview Questions
    await client.query(`
      CREATE TABLE IF NOT EXISTS mock_interview_questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question_text TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // --- PERFORMANCE & CLIENT SATISFACTION ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_satisfaction_reviews (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        rating INTEGER CHECK(rating >= 1 AND rating <= 10),
        comment TEXT,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_performance_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        attendance_score NUMERIC DEFAULT 0,
        task_score NUMERIC DEFAULT 0,
        client_score NUMERIC DEFAULT 0,
        ticket_score NUMERIC DEFAULT 0,
        total_score NUMERIC DEFAULT 0,
        is_pip BOOLEAN DEFAULT FALSE,
        pip_notes TEXT,
        metrics_snapshot JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month, year)
      );
    `);

    // Migration: ensure metrics_snapshot exists in staff_performance_records
    await client.query('ALTER TABLE staff_performance_records ADD COLUMN IF NOT EXISTS metrics_snapshot JSONB');

    // Migration: ensure all columns exist for mock_interview_questions
    await client.query('ALTER TABLE mock_interview_questions ADD COLUMN IF NOT EXISTS question_text TEXT');
    await client.query('ALTER TABLE mock_interview_questions ADD COLUMN IF NOT EXISTS category TEXT');
    await client.query('ALTER TABLE mock_interview_questions ADD COLUMN IF NOT EXISTS difficulty TEXT');
    
    // Data Migration: Copy 'text' to 'question_text' if 'text' column exists and question_text is null
    try {
        const hasTextCol = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mock_interview_questions' AND column_name = 'text'
        `);
        if (hasTextCol.rows.length > 0) {
            await client.query('UPDATE mock_interview_questions SET question_text = text WHERE question_text IS NULL');
            // Drop NOT NULL constraint from old 'text' column to allow new inserts
            await client.query('ALTER TABLE mock_interview_questions ALTER COLUMN "text" DROP NOT NULL');
        }
    } catch (err) {
        console.log('Note: Data migration for mock_interview_questions failed or not needed:', err.message);
    }

    // Re-apply NOT NULL to question_text and category if they were added as NULLable
    try {
        await client.query('ALTER TABLE mock_interview_questions ALTER COLUMN question_text SET NOT NULL');
        await client.query('ALTER TABLE mock_interview_questions ALTER COLUMN category SET NOT NULL');
    } catch (err) {
        console.log('Note: Could not set NOT NULL on mock_interview_questions (might already be set or have nulls)');
    }

    // Fix difficulty constraint case
    try {
        await client.query('ALTER TABLE mock_interview_questions DROP CONSTRAINT IF EXISTS mock_interview_questions_difficulty_check');
        await client.query("ALTER TABLE mock_interview_questions ADD CONSTRAINT mock_interview_questions_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'))");
        // Update existing data to lowercase
        await client.query("UPDATE mock_interview_questions SET difficulty = LOWER(difficulty) WHERE difficulty IS NOT NULL");
    } catch (err) {
        console.log('Note: Could not update difficulty constraint on mock_interview_questions');
    }

    // Mock Interview Templates
    await client.query(`
      CREATE TABLE IF NOT EXISTS mock_interview_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(50),
        visa_types TEXT[],
        questions JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Migration: ensure all columns exist for mock_interview_templates
    await client.query('ALTER TABLE mock_interview_templates ADD COLUMN IF NOT EXISTS name VARCHAR(255)');
    await client.query('ALTER TABLE mock_interview_templates ADD COLUMN IF NOT EXISTS description TEXT');
    await client.query('ALTER TABLE mock_interview_templates ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50)');
    await client.query('ALTER TABLE mock_interview_templates ADD COLUMN IF NOT EXISTS visa_types TEXT[]');
    await client.query('ALTER TABLE mock_interview_templates ADD COLUMN IF NOT EXISTS questions JSONB');
    
    // Data Migration: Copy 'title' to 'name' and 'visa_type' to 'visa_types' if needed
    try {
        const hasTitleCol = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mock_interview_templates' AND column_name = 'title'
        `);
        if (hasTitleCol.rows.length > 0) {
            await client.query('UPDATE mock_interview_templates SET name = title WHERE name IS NULL');
            await client.query('ALTER TABLE mock_interview_templates ALTER COLUMN "title" DROP NOT NULL');
        }

        const hasVisaTypeCol = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mock_interview_templates' AND column_name = 'visa_type'
        `);
        if (hasVisaTypeCol.rows.length > 0) {
            await client.query('UPDATE mock_interview_templates SET visa_types = ARRAY[visa_type] WHERE visa_types IS NULL AND visa_type IS NOT NULL');
            await client.query('ALTER TABLE mock_interview_templates ALTER COLUMN "visa_type" DROP NOT NULL');
        }
    } catch (err) {
        console.log('Note: Data migration for mock_interview_templates failed or not needed:', err.message);
    }

    // Re-apply NOT NULL to name if it was added as NULLable
    try {
        await client.query('ALTER TABLE mock_interview_templates ALTER COLUMN name SET NOT NULL');
    } catch (err) {
        console.log('Note: Could not set NOT NULL on mock_interview_templates.name');
    }
    console.log("✅ Mock Interview tables initialized");

    // Document Submissions table (for approval workflow)
    // Drop and recreate to fix any broken prior state (table has no user data yet)
    try {
      // Check if table has the required columns; if not, drop and recreate
      const colCheck = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'document_submissions' AND column_name = 'contact_id'
      `);
      if (colCheck.rows.length === 0) {
        // Table exists but is missing contact_id – drop it so we can create it properly
        console.log('📡 [Migration] Dropping broken document_submissions table and recreating...');
        await client.query('DROP TABLE IF EXISTS document_submissions CASCADE');
      }
    } catch (_) { /* table didn't exist at all, that's fine */ }

    await client.query(`
      CREATE TABLE IF NOT EXISTS document_submissions (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        content_type TEXT,
        file_data BYTEA,
        file_size INTEGER,
        category TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id)
      )
    `);

    // Indexes are performance-only; wrap in try/catch so they never crash startup
    try { await client.query('CREATE INDEX IF NOT EXISTS idx_doc_submissions_contact_id ON document_submissions(contact_id)'); } catch (_) {}
    try { await client.query('CREATE INDEX IF NOT EXISTS idx_doc_submissions_user_id ON document_submissions(user_id)'); } catch (_) {}
    try { await client.query('CREATE INDEX IF NOT EXISTS idx_doc_submissions_status ON document_submissions(status)'); } catch (_) {}


    // ATTENDANCE & PAYROLL
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        check_in TIMESTAMP,
        check_out TIMESTAMP,
        status TEXT,
        selfie_data BYTEA,
        selfie_mimetype TEXT,
        late_minutes INTEGER DEFAULT 0,
        base_salary_at_time NUMERIC,
        branch TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS selfie_data BYTEA');
    await client.query('ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS selfie_mimetype TEXT');
    await client.query('ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0');
    await client.query('ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS base_salary_at_time NUMERIC');
    await client.query('ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS branch TEXT');


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
        leave_type TEXT DEFAULT 'Paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BRANCHES (Phase 6: Geofencing)
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        radius INTEGER DEFAULT 50, -- radius in meters
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    // PAYSLIPS - stores auto/manual generated payslips per employee per month
    await client.query(`
      CREATE TABLE IF NOT EXISTS payslips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        data JSONB NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month, year)
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

    try {
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT');
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS performance_settings JSONB DEFAULT '{"enrolled": false, "attendance": true, "tasks": true, "reviews": true, "tickets": true}'`);
    } catch (e) {
      console.log('User columns (phone/is_active/performance_settings) might already exist');
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

    // WEBSITE VISITS
    await client.query(`
      CREATE TABLE IF NOT EXISTS website_visits (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        path TEXT NOT NULL,
        user_agent TEXT,
        referrer TEXT,
        is_new_visitor BOOLEAN,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // TASK ATTACHMENTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        content_type TEXT,
        file_data BYTEA,
        file_size INTEGER,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // VISA OPERATIONS
    await client.query(`
      CREATE TABLE IF NOT EXISTS visa_operations (
        id SERIAL PRIMARY KEY,
        vop_number TEXT UNIQUE NOT NULL,
        contact_id INTEGER REFERENCES contacts(id),
        name TEXT NOT NULL,
        phone TEXT,
        country TEXT,
        cgi_data JSONB DEFAULT '{}',
        show_cgi_on_portal BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'form_completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id)
      )
    `);

    // Visa Operation Items table (Dedicated storage for documents and text)
    await client.query(`
      CREATE TABLE IF NOT EXISTS visa_operation_items (
        id SERIAL PRIMARY KEY,
        operation_id INTEGER REFERENCES visa_operations(id) ON DELETE CASCADE,
        item_type TEXT NOT NULL, -- 'document', 'note'
        name TEXT, -- filename or label
        content_type TEXT,
        file_data BYTEA,
        text_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await migrateColumn('visa_operations', 'vopNumber', 'vop_number');
    await migrateColumn('visa_operations', 'contactId', 'contact_id');
    await migrateColumn('visa_operations', 'userId', 'user_id');
    await migrateColumn('visa_operations', 'createdAt', 'created_at');

    // Add cgi_data if it doesn't exist
    const cgiDataExists = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'visa_operations' AND column_name = 'cgi_data'
    `);
    if (cgiDataExists.rows.length === 0) {
      await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS cgi_data JSONB DEFAULT \'{}\'');
    }

    // Add show_cgi_on_portal if it doesn't exist
    const showCgiExists = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'visa_operations' AND column_name = 'show_cgi_on_portal'
    `);
    if (showCgiExists.rows.length === 0) {
      await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS show_cgi_on_portal BOOLEAN DEFAULT false');
    }

    // Add slot_booking_data if it doesn't exist
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS slot_booking_data JSONB DEFAULT \'{}\'');

    // Add visa_interview_data if it doesn't exist
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS visa_interview_data JSONB DEFAULT \'{}\'');

    // Add ds_data if it doesn't exist
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS ds_data JSONB DEFAULT \'{}\'');

    // Move DS-160 fields to proper columns for persistence
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS confirmation_document_id INTEGER REFERENCES visa_operation_items(id) ON DELETE SET NULL');
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS confirmation_document_name TEXT');
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS filling_documents JSONB DEFAULT \'[]\'');
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS student_status TEXT DEFAULT \'pending\'');
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS admin_status TEXT DEFAULT \'pending\'');
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS rejection_reason TEXT');
    await client.query('ALTER TABLE visa_operations ADD COLUMN IF NOT EXISTS admin_name TEXT');

    // UNIVERSITY COURSES
    await client.query(`
      CREATE TABLE IF NOT EXISTS university_courses (
        id SERIAL PRIMARY KEY,
        university_name TEXT NOT NULL,
        country TEXT NOT NULL,
        course_name TEXT NOT NULL,
        intake TEXT NOT NULL,
        min_ssc_percent NUMERIC NOT NULL,
        min_inter_percent NUMERIC NOT NULL,
        min_degree_percent NUMERIC,
        required_exam TEXT,
        min_exam_score NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add accepted_exams column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'university_courses' AND column_name = 'accepted_exams'
        ) THEN
          ALTER TABLE university_courses ADD COLUMN accepted_exams JSONB DEFAULT '[]'::jsonb;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'university_courses' AND column_name = 'application_fee') THEN
          ALTER TABLE university_courses ADD COLUMN application_fee VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'university_courses' AND column_name = 'enrollment_deposit') THEN
          ALTER TABLE university_courses ADD COLUMN enrollment_deposit VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'university_courses' AND column_name = 'wes_requirement') THEN
          ALTER TABLE university_courses ADD COLUMN wes_requirement VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'university_courses' AND column_name = 'logo_url') THEN
          ALTER TABLE university_courses ADD COLUMN logo_url TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'university_courses' AND column_name = 'logo_data') THEN
          ALTER TABLE university_courses ADD COLUMN logo_data BYTEA;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'university_courses' AND column_name = 'logo_mimetype') THEN
          ALTER TABLE university_courses ADD COLUMN logo_mimetype TEXT;
        END IF;
      END $$;
    `);

    // EMAIL TEMPLATES
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        from_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert Default Email Templates if none exist
    const templatesCount = await client.query('SELECT COUNT(*) FROM email_templates');
    if (parseInt(templatesCount.rows[0].count, 10) === 0) {
      console.log('📡 Inserting default email templates');
      await client.query(`
        INSERT INTO email_templates (name, subject, body) VALUES 
        ('Payment Receipt', 'Payment Receipt for {{amount}}', 'Dear {{client_name}},<br><br>We have received your payment of {{amount}} on {{date}}.<br><br>Thank you!'),
        ('Application Confirmation', 'Application Received for {{service}}', 'Dear {{client_name}},<br><br>Your application for {{service}} has been successfully submitted on {{date}}.<br><br>We will review it and get back to you soon.'),
        ('Document Request', 'Action Required: Missing Documents', 'Dear {{client_name}},<br><br>Please upload the required {{document_name}} to proceed with your application.<br><br>Regards,'),
        ('Status Update', 'Update on your {{service}} Application', 'Dear {{client_name}},<br><br>The status of your application has changed to: <strong>{{status}}</strong>.<br><br>Regards,')
      `);
    }

    // AUTOMATION RULES
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_rules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        trigger_event TEXT NOT NULL,
        conditions JSONB DEFAULT '[]',
        action_send_email BOOLEAN DEFAULT false,
        email_template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
        email_recipient TEXT,
        action_send_whatsapp BOOLEAN DEFAULT false,
        whatsapp_template TEXT,
        action_create_task BOOLEAN DEFAULT false,
        task_template JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration for WhatsApp fields if they don't exist
    await client.query('ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS action_send_whatsapp BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS whatsapp_template TEXT');
    await client.query('ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS action_update_field BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS update_field_config JSONB DEFAULT \'{}\'');

    // AUTOMATION LOGS
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id SERIAL PRIMARY KEY,
        rule_id INTEGER REFERENCES automation_rules(id) ON DELETE SET NULL,
        trigger_event TEXT NOT NULL,
        action_type TEXT NOT NULL, -- 'email', 'task', 'whatsapp' or 'update_field'
        recipient TEXT,
        subject TEXT,
        status TEXT NOT NULL, -- 'success' or 'failed'
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Ensure action_type comment is updated (constraint if it exists would need more complex migration, but literal check is usually in app code)

    // API KEYS
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        key_hash TEXT UNIQUE NOT NULL,
        access_level TEXT DEFAULT 'read-only' CHECK (access_level IN ('read-only', 'read-write')),
        status VARCHAR(20) DEFAULT 'active',
        rate_limit INTEGER DEFAULT 60,
        last_ip TEXT,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 60;
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_ip TEXT;
    `);

    // API KEY LOGS
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_key_logs (
        id SERIAL PRIMARY KEY,
        key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        status_code INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE api_key_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
    `);

    // SYSTEM SETTINGS (for Global Panic Switch)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Initialize Global Panic Switch if not exists
    await client.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('global_api_panic', 'false')
      ON CONFLICT (key) DO NOTHING
    `);

    // --- CONTACT DELETION FIXES (FOREIGN KEYS) ---
    // Ensure all tables referencing contacts(id) allow deletion (CASCADE or SET NULL)
    await client.query(`
      DO $$ 
      BEGIN
          -- visa_operations
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'visa_operations' AND constraint_name = 'visa_operations_contact_id_fkey') THEN
              ALTER TABLE visa_operations DROP CONSTRAINT visa_operations_contact_id_fkey;
          END IF;
          ALTER TABLE visa_operations ADD CONSTRAINT visa_operations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

          -- transactions
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'transactions' AND constraint_name = 'transactions_contact_id_fkey') THEN
              ALTER TABLE transactions DROP CONSTRAINT transactions_contact_id_fkey;
          END IF;
          ALTER TABLE transactions ADD CONSTRAINT transactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

          -- tickets
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'tickets' AND constraint_name = 'tickets_contact_id_fkey') THEN
              ALTER TABLE tickets DROP CONSTRAINT tickets_contact_id_fkey;
          END IF;
          ALTER TABLE tickets ADD CONSTRAINT tickets_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

          -- visitors
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'visitors' AND constraint_name = 'visitors_contact_id_fkey') THEN
              ALTER TABLE visitors DROP CONSTRAINT visitors_contact_id_fkey;
          END IF;
          ALTER TABLE visitors ADD CONSTRAINT visitors_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

          -- tasks
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'tasks' AND constraint_name = 'tasks_contact_id_fkey') THEN
              ALTER TABLE tasks DROP CONSTRAINT tasks_contact_id_fkey;
          END IF;
          ALTER TABLE tasks ADD CONSTRAINT tasks_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
      END $$;
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
  // console.log('📡 Executing query:', text.substring(0, 100));
  return pool.query(text, params);
}

export async function getClient() {
  if (!pool) throw new Error("Database not initialized");
  // console.log('📡 Getting database client');
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
