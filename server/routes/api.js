import express from 'express';
import { query, getClient } from '../database.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// Routes are protected individually with authenticateToken middleware

// Configure multer for memory storage
import multer from 'multer';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Document routes
router.post('/documents', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'Admin' && !req.user.permissions?.['Contacts']?.create) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });

      const { contactId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const result = await query(`
        INSERT INTO documents (contact_id, name, type, size, content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, contact_id, name, type, size, uploaded_at
      `, [contactId, file.originalname, file.mimetype, file.size, file.buffer]);

      res.json(result.rows[0]);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 1, text: 'Submit Application Form', type: 'checkbox', completed: false, isDefault: true },
  { id: 2, text: 'Upload Passport Copy', type: 'checkbox', completed: false, isDefault: true },
  { id: 3, text: 'Initial Consulting Fee Payment', type: 'checkbox', completed: false, isDefault: true },
  { id: 4, text: 'Consulor Remarks', type: 'text', completed: false, response: '', isDefault: true }
];

router.get('/documents/:id', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'Admin' && !req.user.permissions?.['Contacts']?.read) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];
    const isPreview = req.query.preview === 'true';

    res.setHeader('Content-Type', doc.type);
    res.setHeader('Content-Disposition', `${isPreview ? 'inline' : 'attachment'}; filename="${doc.name}"`);
    res.send(doc.content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/contacts/:id/documents', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'Admin' && !req.user.permissions?.['Contacts']?.read) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query('SELECT id, contact_id, name, type, size, uploaded_at FROM documents WHERE contact_id = $1 ORDER BY uploaded_at DESC', [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Users routes
router.get('/users', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, permissions, "mustResetPassword", "createdAt" FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(`
      INSERT INTO users (name, email, password, role, permissions)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, permissions
    `, [name, email.toLowerCase(), hashedPassword, role, JSON.stringify({})]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, permissions } = req.body;

    // Update basic info if provided
    if (name && email) {
      await query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email.toLowerCase(), req.params.id]);
    }

    // Update role if provided
    if (role) {
      await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    }

    // Update permissions if provided (can be updated independently)
    if (permissions !== undefined) {
      await query('UPDATE users SET permissions = $1 WHERE id = $2', [JSON.stringify(permissions), req.params.id]);
    }

    // Return updated user
    const result = await query('SELECT id, name, email, role, permissions, "mustResetPassword" FROM users WHERE id = $1', [req.params.id]);
    const user = result.rows[0];

    // Parse permissions JSON
    if (user && user.permissions) {
      user.permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to transform contact from DB format to API format
const transformContact = (dbContact) => {
  const contact = {
    id: dbContact.id,
    userId: dbContact.userId,
    name: dbContact.name,
    contactId: dbContact.contactId,
    email: dbContact.email,
    phone: dbContact.phone,
    department: dbContact.department,
    major: dbContact.major,
    notes: dbContact.notes,
    fileStatus: dbContact.fileStatus,
    agentAssigned: dbContact.agentAssigned,
    gpa: dbContact.gpa,
    advisor: dbContact.advisor,
    street1: dbContact.street1,
    street2: dbContact.street2,
    city: dbContact.city,
    state: dbContact.state,
    zip: dbContact.zip,
    country: dbContact.country,
    gstin: dbContact.gstin,
    pan: dbContact.pan,
    tags: dbContact.tags,
    visaType: dbContact.visaType,
    countryOfApplication: dbContact.countryOfApplication,
    source: dbContact.source,
    contactType: dbContact.contactType,
    stream: dbContact.stream,
    intake: dbContact.intake,
    counselorAssigned: dbContact.counselorAssigned,
    applicationEmail: dbContact.applicationEmail,
    applicationPassword: dbContact.applicationPassword,
    createdAt: dbContact.createdAt,
    // JSON fields
    checklist: Array.isArray(dbContact.checklist) ? dbContact.checklist : JSON.parse(dbContact.checklist || '[]'),
    activityLog: Array.isArray(dbContact.activityLog) ? dbContact.activityLog : JSON.parse(dbContact.activityLog || '[]'),
    recordedSessions: Array.isArray(dbContact.recordedSessions) ? dbContact.recordedSessions : JSON.parse(dbContact.recordedSessions || '[]'),
    documents: Array.isArray(dbContact.documents) ? dbContact.documents : JSON.parse(dbContact.documents || '[]'),
    visaInformation: typeof dbContact.visaInformation === 'object' ? dbContact.visaInformation : JSON.parse(dbContact.visaInformation || '{}'),
    lmsProgress: typeof dbContact.lmsProgress === 'object' ? dbContact.lmsProgress : JSON.parse(dbContact.lmsProgress || '{}'),
    lmsNotes: typeof dbContact.lmsNotes === 'object' ? dbContact.lmsNotes : JSON.parse(dbContact.lmsNotes || '{}'),
    courses: Array.isArray(dbContact.courses) ? dbContact.courses : JSON.parse(dbContact.courses || '[]'),
  };
  return contact;
};

// Contacts routes
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM contacts';
    let params = [];

    // RBAC: Students only see their own contact record
    if (req.user.role === 'Student') {
      sql = 'SELECT * FROM contacts WHERE "userId" = $1';
      params = [req.user.id];
    }

    const result = await query(sql, params);
    const transformedContacts = result.rows.map(transformContact);
    res.json(transformedContacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/contacts', authenticateToken, async (req, res) => {
  try {
    const contact = req.body;

    // Apply default checklist for new contacts if not provided
    if (!contact.checklist || contact.checklist.length === 0) {
      contact.checklist = DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item, id: Date.now() + Math.random() }));
    }

    // Auto-generate contact reference number if not provided
    let contactId = contact.contactId;
    if (!contactId) {
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const datePrefix = `LA${yy}${mm}${dd}`;

      // Find highest sequence for today
      const todayContacts = await query(
        "SELECT \"contactId\" FROM contacts WHERE \"contactId\" LIKE $1 ORDER BY \"contactId\" DESC LIMIT 1",
        [`${datePrefix}%`]
      );

      let sequence = 0;
      if (todayContacts.rows.length > 0) {
        const lastId = todayContacts.rows[0].contactId;
        sequence = parseInt(lastId.slice(-3)) + 1;
      }

      contactId = `${datePrefix}${String(sequence).padStart(3, '0')}`;
    }

    const result = await query(`
      INSERT INTO contacts (
        "userId", name, "contactId", email, phone, department, major, notes, "fileStatus",
        "agentAssigned", checklist, "activityLog", "recordedSessions", documents, "visaInformation",
        "lmsProgress", "lmsNotes", gpa, advisor, courses, street1, street2, city, state, zip,
        country, gstin, pan, tags, "visaType", "countryOfApplication", source, "contactType",
        stream, intake, "counselorAssigned", "applicationEmail", "applicationPassword"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38)
      RETURNING *
    `, [
      contact.userId || null,
      contact.name,
      contactId,
      contact.email || null,
      contact.phone || null,
      contact.department || 'Unassigned',
      contact.major || 'Unassigned',
      contact.notes || null,
      contact.fileStatus || null,
      contact.agentAssigned || null,
      JSON.stringify(contact.checklist || []),
      JSON.stringify(contact.activityLog || []),
      JSON.stringify(contact.recordedSessions || []),
      JSON.stringify(contact.documents || []),
      JSON.stringify(contact.visaInformation || {}),
      JSON.stringify(contact.lmsProgress || {}),
      JSON.stringify(contact.lmsNotes || {}),
      contact.gpa || null,
      contact.advisor || null,
      JSON.stringify(contact.courses || []),
      contact.street1 || null,
      contact.street2 || null,
      contact.city || null,
      contact.state || null,
      contact.zip || null,
      contact.country || null,
      contact.gstin || null,
      contact.pan || null,
      contact.tags || null,
      contact.visaType || null,
      contact.countryOfApplication || null,
      contact.source || null,
      contact.contactType || null,
      contact.stream || null,
      contact.intake || null,
      contact.counselorAssigned || null,
      contact.applicationEmail || null,
      contact.applicationPassword || null
    ]);
    res.json(transformContact(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contact = req.body;
    await query(`
      UPDATE contacts SET
        name = $1, email = $2, phone = $3, department = $4, major = $5, notes = $6,
        "fileStatus" = $7, "agentAssigned" = $8, checklist = $9, "activityLog" = $10,
        "recordedSessions" = $11, documents = $12, "visaInformation" = $13, "lmsProgress" = $14,
        "lmsNotes" = $15, gpa = $16, advisor = $17, courses = $18, street1 = $19, street2 = $20,
        city = $21, state = $22, zip = $23, country = $24, gstin = $25, pan = $26, tags = $27,
        "visaType" = $28, "countryOfApplication" = $29, source = $30, "contactType" = $31,
        stream = $32, intake = $33, "counselorAssigned" = $34, "applicationEmail" = $35,
        "applicationPassword" = $36
      WHERE id = $37
    `, [
      contact.name,
      contact.email,
      contact.phone,
      contact.department,
      contact.major,
      contact.notes,
      contact.fileStatus,
      contact.agentAssigned,
      JSON.stringify(contact.checklist || []),
      JSON.stringify(contact.activityLog || []),
      JSON.stringify(contact.recordedSessions || []),
      JSON.stringify(contact.documents || []),
      JSON.stringify(contact.visaInformation || {}),
      JSON.stringify(contact.lmsProgress || {}),
      JSON.stringify(contact.lmsNotes || {}),
      contact.gpa,
      contact.advisor,
      JSON.stringify(contact.courses || []),
      contact.street1,
      contact.street2,
      contact.city,
      contact.state,
      contact.zip,
      contact.country,
      contact.gstin,
      contact.pan,
      contact.tags,
      contact.visaType,
      contact.countryOfApplication,
      contact.source,
      contact.contactType,
      contact.stream,
      contact.intake,
      contact.counselorAssigned,
      contact.applicationEmail,
      contact.applicationPassword,
      req.params.id
    ]);
    const result = await query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    res.json(transformContact(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to transform lead keys
// Helper to transform lead keys
const transformLead = (lead) => {
  const { assignedTo, createdAt, ...rest } = lead;
  return {
    ...rest,
    assignedTo,
    createdAt
  };
};

// Leads routes
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    // Only admin can update users
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (req.body.role) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(req.body.role);
    }

    if (!updateFields.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, permissions`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (Admin only) - PRESERVES all business data
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    const userIdToDelete = parseInt(req.params.id);

    // Prevent self-deletion
    if (userIdToDelete === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user exists and get their role
    const userCheck = await query('SELECT role FROM users WHERE id = $1', [userIdToDelete]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userCheck.rows[0].role;

    // If deleting an admin, check if they're the last admin
    if (userRole === 'Admin') {
      const adminCount = await query('SELECT COUNT(*) FROM users WHERE role = $1', ['Admin']);
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin account' });
      }
    }

    // IMPORTANT: We only delete the user and their contact
    // All business data (leads, activities, etc.) is preserved

    // Delete user's contact record
    // Delete user's contact record
    await query('DELETE FROM contacts WHERE "userId" = $1', [userIdToDelete]);

    // Delete the user account
    await query('DELETE FROM users WHERE id = $1', [userIdToDelete]);

    res.json({
      success: true,
      message: 'User deleted successfully. All business data has been preserved.'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/leads', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM leads');
    res.json(result.rows.map(transformLead));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leads/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(transformLead(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/leads', authenticateToken, async (req, res) => {
  try {
    const lead = req.body;

    // 1. Create the Lead
    const leadResult = await query(`
      INSERT INTO leads (title, company, value, contact, stage, email, phone, source, "assignedTo", notes, quotations)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      lead.title,
      lead.company,
      lead.value || 0,
      lead.contact,
      lead.stage || 'New',
      lead.email || null,
      lead.phone || null,
      lead.source || null,
      lead.assignedTo || null,
      lead.notes || null,
      JSON.stringify(lead.quotations || [])
    ]);

    const newLead = leadResult.rows[0];

    // 2. Automatically Create a Contact
    // Generate Contact ID
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `LA${yy}${mm}${dd}`;

    const todayContacts = await query(
      "SELECT \"contactId\" FROM contacts WHERE \"contactId\" LIKE $1 ORDER BY \"contactId\" DESC LIMIT 1",
      [`${datePrefix}%`]
    );

    let sequence = 0;
    if (todayContacts.rows.length > 0) {
      const lastId = todayContacts.rows[0].contactId;
      sequence = parseInt(lastId.slice(-3)) + 1;
    }
    const newContactId = `${datePrefix}${String(sequence).padStart(3, '0')}`;

    // Insert Contact
    await query(`
      INSERT INTO contacts (
        name, "contactId", email, phone, department, major, notes, source, "contactType", checklist, "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      lead.contact, // Contact Name
      newContactId,
      lead.email || null,
      lead.phone || null,
      'Unassigned',
      'Unassigned',
      `Auto-created from Lead: ${lead.title}`,
      lead.source || 'CRM Lead',
      'Lead',
      JSON.stringify([{ id: 0, text: 'Documents', completed: false, type: 'checkbox' }])
    ]);

    // 3. Send Notification (Placeholder for Request #4)
    // 3. Send Notification
    if (lead.assignedTo) {
      // Find user ID by name (assignedTo is name string)
      const assignedUserResult = await query('SELECT id FROM users WHERE name = $1', [lead.assignedTo]);
      if (assignedUserResult.rows.length > 0) {
        const userId = assignedUserResult.rows[0].id;
        await query(`
          INSERT INTO notifications (title, description, read, "linkTo", "recipientUserIds", timestamp)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          'New Lead Assigned',
          `You have been assigned a new lead: ${lead.title}`,
          false,
          JSON.stringify({ type: 'lead', id: newLead.id }),
          JSON.stringify([userId])
        ]);
        console.log(`[Notification] Lead assigned to ${lead.assignedTo} (User ID: ${userId})`);
      }
    }

    res.json(transformLead(newLead));
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/leads/:id', authenticateToken, async (req, res) => {
  try {
    const lead = req.body;
    await query(`
      UPDATE leads SET
        title = $1, company = $2, value = $3, contact = $4, stage = $5,
        email = $6, phone = $7, source = $8, "assignedTo" = $9, notes = $10, quotations = $11
      WHERE id = $12
    `, [
      lead.title,
      lead.company,
      lead.value,
      lead.contact,
      lead.stage,
      lead.email,
      lead.phone,
      lead.source,
      lead.assignedTo,
      lead.notes,
      JSON.stringify(lead.quotations || []),
      req.params.id
    ]);
    const result = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    res.json(transformLead(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/leads/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('DELETE FROM leads WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ success: true, deletedLead: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions routes
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM transactions');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions', authenticateToken, async (req, res) => {
  try {
    const transaction = req.body;
    const id = transaction.id || `INV-${String(Date.now()).slice(-6)}`;
    const result = await query(`
      INSERT INTO transactions (id, "customerName", date, description, type, status, amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      id,
      transaction.customerName,
      transaction.date,
      transaction.description || null,
      transaction.type,
      transaction.status || 'Pending',
      transaction.amount
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = req.body;
    await query(`
      UPDATE transactions SET
        "customerName" = $1, date = $2, description = $3, type = $4, status = $5, amount = $6
      WHERE id = $7
    `, [
      transaction.customerName,
      transaction.date,
      transaction.description,
      transaction.type,
      transaction.status,
      transaction.amount,
      req.params.id
    ]);
    const result = await query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Events routes
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM events');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/events', authenticateToken, async (req, res) => {
  try {
    const event = req.body;
    const result = await query(`
      INSERT INTO events (title, start, "end", color, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      event.title,
      event.start,
      event.end,
      event.color,
      event.description || null
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/events/:id', authenticateToken, async (req, res) => {
  try {
    const event = req.body;
    await query(`
      UPDATE events SET title = $1, start = $2, "end" = $3, color = $4, description = $5
      WHERE id = $6
    `, [
      event.title,
      event.start,
      event.end,
      event.color,
      event.description,
      req.params.id
    ]);
    const result = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks routes
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM tasks WHERE "userId" = $1 OR "userId" IS NULL', [req.user.id]);
    res.json(result.rows.map(t => ({
      ...t,
      userId: t.userId,
      dueDate: t.dueDate
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const task = req.body;
    const result = await query(`
      INSERT INTO tasks (title, description, "dueDate", status, "userId")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      task.title,
      task.description || null,
      task.dueDate,
      task.status || 'todo',
      req.user.id
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Channels routes
router.get('/channels', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM channels');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/channels', authenticateToken, async (req, res) => {
  try {
    const channel = req.body;
    const id = channel.id || `channel-${Date.now()}`;
    const result = await query(`
      INSERT INTO channels (id, name, type, members, messages)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      id,
      channel.name,
      channel.type || 'public',
      JSON.stringify(channel.members || []),
      JSON.stringify(channel.messages || [])
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/channels/:id', authenticateToken, async (req, res) => {
  try {
    const channel = req.body;
    await query(`
      UPDATE channels SET name = $1, type = $2, members = $3, messages = $4
      WHERE id = $5
    `, [
      channel.name,
      channel.type,
      JSON.stringify(channel.members || []),
      JSON.stringify(channel.messages || []),
      req.params.id
    ]);
    const result = await query('SELECT * FROM channels WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Coupons routes
router.get('/coupons', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM coupons');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/coupons', authenticateToken, async (req, res) => {
  try {
    const coupon = req.body;
    const result = await query(`
      INSERT INTO coupons (code, discount_percentage, is_active, applicable_course_ids)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code) DO UPDATE SET
        discount_percentage = $2, is_active = $3, applicable_course_ids = $4
      RETURNING *
    `, [
      coupon.code,
      coupon.discountPercentage,
      coupon.isActive,
      JSON.stringify(coupon.applicableCourseIds || [])
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/coupons/:code', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM coupons WHERE code = $1', [req.params.code]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LMS Courses routes
router.get('/lms-courses', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM lms_courses');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lms-courses', authenticateToken, async (req, res) => {
  try {
    const course = req.body;
    const id = course.id || `course-${Date.now()}`;
    const result = await query(`
      INSERT INTO lms_courses (id, title, description, instructor, price, modules, discussions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = $2, description = $3, instructor = $4, price = $5, modules = $6, discussions = $7
      RETURNING *
    `, [
      id,
      course.title,
      course.description || null,
      course.instructor || null,
      course.price || null,
      JSON.stringify(course.modules || []),
      JSON.stringify(course.discussions || [])
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/lms-courses/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM lms_courses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Visitors routes
router.get('/visitors', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM visitors');
    const visitors = result.rows.map(v => ({
      ...v,
      scheduledCheckIn: v.scheduledCheckIn,
      checkIn: v.checkIn,
      checkOut: v.checkOut,
      cardNumber: v.cardNumber,
      createdAt: v.createdAt
    }));
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visitors', authenticateToken, async (req, res) => {
  try {
    const { name, company, host, scheduledCheckIn, checkIn, checkOut, status, cardNumber } = req.body;
    const result = await query(`
      INSERT INTO visitors (name, company, host, "scheduledCheckIn", "checkIn", "checkOut", status, "cardNumber")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name,
      company,
      host,
      scheduledCheckIn || null,
      checkIn || null,
      checkOut || null,
      status || 'Scheduled',
      cardNumber || null
    ]);
    const v = result.rows[0];
    const formattedVisitor = {
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      createdAt: v.created_at
    };
    res.json(formattedVisitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single visitor by ID
router.get('/visitors/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM visitors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    const v = result.rows[0];
    const formattedVisitor = {
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      createdAt: v.created_at
    };
    res.json(formattedVisitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visitors/:id', authenticateToken, async (req, res) => {
  try {
    const visitor = req.body;
    await query(`
      UPDATE visitors SET
        name = $1, company = $2, host = $3, "scheduledCheckIn" = $4, "checkIn" = $5,
        "checkOut" = $6, status = $7, "cardNumber" = $8
      WHERE id = $9
    `, [
      visitor.name,
      visitor.company,
      visitor.host,
      visitor.scheduledCheckIn,
      visitor.checkIn,
      visitor.checkOut,
      visitor.status,
      visitor.cardNumber,
      req.params.id
    ]);
    const result = await query('SELECT * FROM visitors WHERE id = $1', [req.params.id]);
    const v = result.rows[0];
    const formattedVisitor = {
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      createdAt: v.created_at
    };
    res.json(formattedVisitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quotation Templates routes
router.get('/quotation-templates', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, title, description, line_items AS "lineItems", total, created_at AS "createdAt" FROM quotation_templates');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quotation-templates', authenticateToken, async (req, res) => {
  try {
    const template = req.body;
    const result = await query(`
      INSERT INTO quotation_templates (title, description, "lineItems", total)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, "lineItems", total, "createdAt"
    `, [
      template.title,
      template.description || null,
      JSON.stringify(template.lineItems || []),
      template.total || 0
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/quotation-templates/:id', authenticateToken, async (req, res) => {
  try {
    const template = req.body;
    await query(`
      UPDATE quotation_templates SET title = $1, description = $2, "lineItems" = $3, total = $4
      WHERE id = $5
    `, [
      template.title,
      template.description,
      JSON.stringify(template.lineItems || []),
      template.total,
      req.params.id
    ]);
    const result = await query('SELECT id, title, description, "lineItems", total, "createdAt" FROM quotation_templates WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/quotation-templates/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM quotation_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activity Log routes
router.get('/activity-log', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/activity-log', authenticateToken, async (req, res) => {
  try {
    const { adminName, action } = req.body;
    const result = await query(`
      INSERT INTO activity_log ("adminName", action)
      VALUES ($1, $2)
      RETURNING *
    `, [adminName, action]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Activity Log routes
router.get('/payment-activity-log', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM payment_activity_log ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/payment-activity-log', authenticateToken, async (req, res) => {
  try {
    const { text, amount, type } = req.body;
    const result = await query(`
      INSERT INTO payment_activity_log (text, amount, type)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [text, amount, type]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications routes
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications', authenticateToken, async (req, res) => {
  try {
    const notification = req.body;
    const result = await query(`
      INSERT INTO notifications (title, description, read, "linkTo", "recipientUserIds", "recipientRoles")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      notification.title,
      notification.description,
      notification.read || false,
      JSON.stringify(notification.linkTo || {}),
      JSON.stringify(notification.recipientUserIds || []),
      JSON.stringify(notification.recipientRoles || [])
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await query(`
      UPDATE notifications SET read = true 
      WHERE "recipientUserIds"::jsonb @> $1::jsonb 
      OR "recipientRoles"::jsonb @> $2::jsonb
    `, [JSON.stringify([req.user.id]), JSON.stringify([req.user.role])]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
