import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });
if (!process.env.DATABASE_URL) {
    dotenv.config();
}

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedData() {
    console.log('\n🌱 Seeding Database with Demo Data...\n');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // --- 1. Create Contacts ---
        console.log('Inserting Contacts...');
        const contactsValues = [
            ['Alice Johnson', 'alice@example.com', '555-0101', 'Student', 'Computer Science', 'Undergraduate'],
            ['Bob Smith', 'bob@example.com', '555-0202', 'Agent', 'Marketing', ''],
            ['Charlie Brown', 'charlie@example.com', '555-0303', 'Student', 'Physics', 'Graduate'],
            ['Diana Prince', 'diana@example.com', '555-0404', 'Staff', 'Administration', ''],
            ['Evan Wright', 'evan@example.com', '555-0505', 'Student', 'Mathematics', 'Undergraduate']
        ];

        for (const c of contactsValues) {
            await client.query(`
                INSERT INTO contacts (name, email, phone, contact_type, department, stream, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, c);
        }

        // --- 2. Create Leads (CRM) ---
        console.log('Inserting CRM Leads...');
        const leadsValues = [
            ['Software License Deal', 'TechCorp', 5000, 'New', 'Alice Johnson'],
            ['Annual Partnership', 'EduGlobal', 12000, 'Qualified', 'Bob Smith'],
            ['Research Grant', 'Science Foundation', 25000, 'Proposal', 'Charlie Brown'],
            ['Q1 Training Program', 'Local School District', 3500, 'Won', 'Diana Prince'],
            ['Website Redesign', 'StartupInc', 8000, 'Lost', 'Evan Wright']
        ];

        for (const l of leadsValues) {
            await client.query(`
                INSERT INTO leads (title, company, value, stage, contact, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, l);
        }

        // --- 3. Create Tasks ---
        console.log('Inserting Tasks...');
        // We need a user ID for tasks, let's try to get the first user or default to null if foreign key constraints allow or just pick 1
        // Assuming there is at least one user (admin) from previous steps.
        const userRes = await client.query('SELECT id FROM users LIMIT 1');
        const userId = userRes.rows.length > 0 ? userRes.rows[0].id : null;

        if (userId) {
            const tasksValues = [
                ['Review Q3 Reports', 'Analyze the quarterly performance metrics.', 'todo'],
                ['Client Meeting with TechCorp', 'Discuss the software license deal requirements.', 'inProgress'],
                ['Update Website Content', 'Refresh the homepage banners and news section.', 'done']
            ];

            for (const t of tasksValues) {
                // due_date as simple string YYYY-MM-DD for now as per schema check or text
                const dueDate = new Date().toISOString().split('T')[0];
                await client.query(`
                    INSERT INTO tasks (title, description, status, due_date, user_id, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [t[0], t[1], t[2], dueDate, userId]);
            }
        }

        // --- 4. Create Calendar Events ---
        console.log('Inserting Calendar Events...');
        const eventsValues = [
            ['Team Weekly Sync', 'blue', 0], // today
            ['Project Deadline', 'red', 2],  // 2 days from now
            ['Client Lunch', 'green', 1]     // tomorrow
        ];

        for (const e of eventsValues) {
            const start = new Date();
            start.setDate(start.getDate() + e[2]);
            start.setHours(10, 0, 0);

            const end = new Date(start);
            end.setHours(11, 0, 0);

            await client.query(`
                INSERT INTO events (title, color, start, "end", description, created_at)
                VALUES ($1, $2, $3, $4, 'Automated demo event', NOW())
            `, [e[0], e[1], start.toISOString(), end.toISOString()]);
        }

        await client.query('COMMIT');
        console.log('\n✅ Database seeded successfully!');
        console.log('You can now refresh the application to see the data.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding database:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedData();
