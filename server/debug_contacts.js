
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const transformContact = (dbContact) => {
    try {
        const contact = {
            id: dbContact.id,
            // ... (abbreviated validation)
            checklist: Array.isArray(dbContact.checklist) ? dbContact.checklist : JSON.parse(dbContact.checklist || '[]'),
            activityLog: Array.isArray(dbContact.activity_log) ? dbContact.activity_log : JSON.parse(dbContact.activity_log || '[]'),
            recordedSessions: Array.isArray(dbContact.recorded_sessions) ? dbContact.recorded_sessions : JSON.parse(dbContact.recorded_sessions || '[]'),
            documents: Array.isArray(dbContact.documents) ? dbContact.documents : JSON.parse(dbContact.documents || '[]'),
            visaInformation: typeof dbContact.visa_information === 'object' ? dbContact.visa_information : JSON.parse(dbContact.visa_information || '{}'),
            lmsProgress: typeof dbContact.lms_progress === 'object' ? dbContact.lms_progress : JSON.parse(dbContact.lms_progress || '{}'),
            lmsNotes: typeof dbContact.lms_notes === 'object' ? dbContact.lms_notes : JSON.parse(dbContact.lms_notes || '{}'),
            courses: Array.isArray(dbContact.courses) ? dbContact.courses : JSON.parse(dbContact.courses || '[]'),
        };
        return contact;
    } catch (err) {
        console.error(`FAILED to transform contact ID ${dbContact.id}:`, err.message);
        return null;
    }
};

async function check() {
    console.log('Fetching contacts...');
    const result = await pool.query('SELECT * FROM contacts');
    console.log(`Found ${result.rows.length} contacts.`);

    let failures = 0;
    result.rows.forEach(r => {
        const t = transformContact(r);
        if (!t) failures++;
    });

    if (failures === 0) console.log('All contacts transformed successfully.');
    else console.log(`${failures} contacts failed transformation.`);

    pool.end();
}

check();
