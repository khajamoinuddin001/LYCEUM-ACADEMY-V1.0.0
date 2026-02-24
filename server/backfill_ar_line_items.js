import '../server/load_env.js';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function run() {
    const client = await pool.connect();
    let updatedCount = 0;
    try {
        // 1. Get all leads with quotations
        const leadsRes = await client.query('SELECT id, quotations FROM leads WHERE quotations IS NOT NULL');
        const quotationsMap = {}; // quotationId -> lineItems
        for (const row of leadsRes.rows) {
            const quotations = typeof row.quotations === 'string' ? JSON.parse(row.quotations) : row.quotations;
            if (Array.isArray(quotations)) {
                for (const q of quotations) {
                    quotationsMap[q.id] = q.lineItems || [];
                }
            }
        }

        // 2. Get all contacts with AR
        const contactsRes = await client.query('SELECT id, metadata FROM contacts WHERE metadata IS NOT NULL');
        for (const row of contactsRes.rows) {
            const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
            if (metadata && metadata.accountsReceivable && metadata.accountsReceivable.length > 0) {
                let changed = false;
                metadata.accountsReceivable.forEach(ar => {
                    if (!ar.lineItems && ar.quotationId && quotationsMap[ar.quotationId]) {
                        ar.lineItems = quotationsMap[ar.quotationId];
                        changed = true;
                    }
                });

                if (changed) {
                    await client.query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), row.id]);
                    updatedCount++;
                }
            }
        }
        console.log(`Successfully backfilled AR line items for ${updatedCount} contacts.`);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
