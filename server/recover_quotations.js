import './load_env.js';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function recover() {
  const client = await pool.connect();
  let recoveredCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    console.log('📡 Starting Quotation Recovery...');

    // 1. Fetch all leads with quotations
    const leadsRes = await client.query('SELECT * FROM leads WHERE quotations IS NOT NULL AND jsonb_array_length(quotations) > 0');
    console.log(`🔍 Found ${leadsRes.rows.length} leads with quotations.`);

    for (const lead of leadsRes.rows) {
      try {
        let quotations = lead.quotations;
        if (typeof quotations === 'string') quotations = JSON.parse(quotations);

        // Filter for accepted/agreed quotations
        const acceptedQuotations = quotations.filter(q => q.status === 'Accepted' || q.status === 'Agreed');
        if (acceptedQuotations.length === 0) continue;

        // 2. Find matching contact
        let contactRes = await client.query(
          'SELECT * FROM contacts WHERE (email = $1 AND email IS NOT NULL AND email != \'\') OR (phone = $2 AND phone IS NOT NULL AND phone != \'\')',
          [lead.email, lead.phone]
        );

        // Fallback to name matching if no primary match
        if (contactRes.rows.length === 0 && lead.contact) {
          contactRes = await client.query(
            'SELECT * FROM contacts WHERE name = $1',
            [lead.contact]
          );
        }

        if (contactRes.rows.length === 0) {
          console.log(`⚠️  No contact found for lead: "${lead.contact}" (Email: ${lead.email || 'N/A'}, Phone: ${lead.phone || 'N/A'})`);
          skippedCount++;
          continue;
        }

        const contact = contactRes.rows[0];
        let metadata = contact.metadata || {};
        if (typeof metadata === 'string') {
          try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
        }
        
        if (!metadata.accountsReceivable) metadata.accountsReceivable = [];

        let arUpdated = false;

        for (const quo of acceptedQuotations) {
          const quoId = quo.id;
          const quoRef = quo.quotationNumber || (String(quoId).startsWith('QUO-') ? quoId : `QUO-${quoId}`);

          // Check if already exists in AR
          const exists = metadata.accountsReceivable.some(ar => 
            String(ar.quotationId) === String(quoId) || ar.quotationRef === quoRef
          );

          if (!exists) {
            // Create AR entry
            const arEntry = {
              id: Date.now() + Math.floor(Math.random() * 1000),
              quotationId: quo.id,
              quotationRef: quoRef,
              leadId: lead.id,
              totalAmount: quo.total,
              paidAmount: 0, // We set to 0, user might need to re-link paid invoices
              remainingAmount: quo.total,
              status: 'Outstanding', 
              createdAt: quo.date || new Date().toISOString(),
              agreedAt: new Date().toISOString(),
              lineItems: quo.lineItems || []
            };
            
            metadata.accountsReceivable.push(arEntry);
            arUpdated = true;
            recoveredCount++;
            console.log(`✅ Recovered ${quoRef} for contact: ${contact.name}`);
          }
        }

        if (arUpdated) {
          await client.query(
            'UPDATE contacts SET metadata = $1 WHERE id = $2',
            [JSON.stringify(metadata), contact.id]
          );
        }

      } catch (innerError) {
        console.error(`❌ Error processing lead ${lead.id}:`, innerError.message);
        errorCount++;
      }
    }

    console.log('\n✨ Recovery Complete!');
    console.log(`------------------------------`);
    console.log(`✅ Total Recovered: ${recoveredCount}`);
    console.log(`⏭️  Skipped (No match): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`------------------------------`);

  } finally {
    client.release();
    await pool.end();
  }
}

recover().catch(err => {
  console.error('💥 Fatal Error:', err);
  process.exit(1);
});
