import express from 'express';
import { query, getClient } from '../database.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// Apply auth to all routes
router.use(authenticateToken);

// Configure multer for memory storage
import multer from 'multer';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Document routes
router.post('/documents', async (req, res) => {
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

router.get('/documents/:id', async (req, res) => {
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
    res.setHeader('Content-Type', doc.type);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    res.send(doc.content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/contacts/:id/documents', async (req, res) => {
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
router.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, permissions, must_reset_password AS "mustResetPassword", created_at AS "createdAt" FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', requireRole('Admin'), async (req, res) => {
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

router.put('/users/:id', async (req, res) => {
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
    const result = await query('SELECT id, name, email, role, permissions FROM users WHERE id = $1', [req.params.id]);
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
    userId: dbContact.user_id,
    name: dbContact.name,
    contactId: dbContact.contact_id,
    email: dbContact.email,
    phone: dbContact.phone,
    department: dbContact.department,
    major: dbContact.major,
    notes: dbContact.notes,
    fileStatus: dbContact.file_status,
    agentAssigned: dbContact.agent_assigned,
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
    visaType: dbContact.visa_type,
    countryOfApplication: dbContact.country_of_application,
    source: dbContact.source,
    contactType: dbContact.contact_type,
    stream: dbContact.stream,
    intake: dbContact.intake,
    counselorAssigned: dbContact.counselor_assigned,
    applicationEmail: dbContact.application_email,
    applicationPassword: dbContact.application_password,
    createdAt: dbContact.created_at,
    // JSON fields
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
};

// Contacts routes
router.get('/contacts', async (req, res) => {
  try {
    const result = await query('SELECT * FROM contacts');
    const transformedContacts = result.rows.map(transformContact);
    res.json(transformedContacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/contacts', async (req, res) => {
  try {
    const contact = req.body;

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
        user_id, name, contact_id, email, phone, department, major, notes, file_status,
        agent_assigned, checklist, activity_log, recorded_sessions, documents, visa_information,
        lms_progress, lms_notes, gpa, advisor, courses, street1, street2, city, state, zip,
        country, gstin, pan, tags, visa_type, country_of_application, source, contact_type,
        stream, intake, counselor_assigned, application_email, application_password
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

router.put('/contacts/:id', async (req, res) => {
  try {
    const contact = req.body;
    await query(`
      UPDATE contacts SET
        name = $1, email = $2, phone = $3, department = $4, major = $5, notes = $6,
        file_status = $7, agent_assigned = $8, checklist = $9, activity_log = $10,
        recorded_sessions = $11, documents = $12, visa_information = $13, lms_progress = $14,
        lms_notes = $15, gpa = $16, advisor = $17, courses = $18, street1 = $19, street2 = $20,
        city = $21, state = $22, zip = $23, country = $24, gstin = $25, pan = $26, tags = $27,
        visa_type = $28, country_of_application = $29, source = $30, contact_type = $31,
        stream = $32, intake = $33, counselor_assigned = $34, application_email = $35,
        application_password = $36
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
  return {
    ...lead,
    assignedTo: lead.assigned_to
  };
};

// Leads routes
router.get('/leads', async (req, res) => {
  try {
    const result = await query('SELECT * FROM leads');
    res.json(result.rows.map(transformLead));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leads/:id', async (req, res) => {
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

router.post('/leads', async (req, res) => {
  try {
    const lead = req.body;
    const result = await query(`
      INSERT INTO leads (title, company, value, contact, stage, email, phone, source, assigned_to, notes, quotations)
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
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const lead = req.body;
    await query(`
      UPDATE leads SET
        title = $1, company = $2, value = $3, contact = $4, stage = $5,
        email = $6, phone = $7, source = $8, assigned_to = $9, notes = $10, quotations = $11
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
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions routes
router.get('/transactions', async (req, res) => {
  try {
    const result = await query('SELECT * FROM transactions');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const transaction = req.body;
    const id = transaction.id || `INV-${String(Date.now()).slice(-6)}`;
    const result = await query(`
      INSERT INTO transactions (id, customer_name, date, description, type, status, amount)
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

router.put('/transactions/:id', async (req, res) => {
  try {
    const transaction = req.body;
    await query(`
      UPDATE transactions SET
        customer_name = $1, date = $2, description = $3, type = $4, status = $5, amount = $6
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
router.get('/events', async (req, res) => {
  try {
    const result = await query('SELECT * FROM events');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/events', async (req, res) => {
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

router.put('/events/:id', async (req, res) => {
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

router.delete('/events/:id', async (req, res) => {
  try {
    await query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks routes
router.get('/tasks', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tasks WHERE user_id = $1 OR user_id IS NULL', [req.user.id]);
    res.json(result.rows.map(t => ({
      ...t,
      userId: t.user_id,
      dueDate: t.due_date
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const task = req.body;
    const result = await query(`
      INSERT INTO tasks (title, description, due_date, status, user_id)
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
router.get('/channels', async (req, res) => {
  try {
    const result = await query('SELECT * FROM channels');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/channels', async (req, res) => {
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

router.put('/channels/:id', async (req, res) => {
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
router.get('/coupons', async (req, res) => {
  try {
    const result = await query('SELECT * FROM coupons');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/coupons', async (req, res) => {
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

router.delete('/coupons/:code', async (req, res) => {
  try {
    await query('DELETE FROM coupons WHERE code = $1', [req.params.code]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LMS Courses routes
router.get('/lms-courses', async (req, res) => {
  try {
    const result = await query('SELECT * FROM lms_courses');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lms-courses', async (req, res) => {
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

router.delete('/lms-courses/:id', async (req, res) => {
  try {
    await query('DELETE FROM lms_courses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Visitors routes
router.get('/visitors', async (req, res) => {
  try {
    const result = await query('SELECT * FROM visitors');
    const visitors = result.rows.map(v => ({
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      createdAt: v.created_at
    }));
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visitors', async (req, res) => {
  try {
    const { name, company, host, scheduledCheckIn, checkIn, checkOut, status, cardNumber } = req.body;
    const result = await query(`
      INSERT INTO visitors (name, company, host, scheduled_check_in, check_in, check_out, status, card_number)
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
router.get('/visitors/:id', async (req, res) => {
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

router.put('/visitors/:id', async (req, res) => {
  try {
    const visitor = req.body;
    await query(`
      UPDATE visitors SET
        name = $1, company = $2, host = $3, scheduled_check_in = $4, check_in = $5,
        check_out = $6, status = $7, card_number = $8
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
router.get('/quotation-templates', async (req, res) => {
  try {
    const result = await query('SELECT id, title, description, line_items AS "lineItems", total, created_at AS "createdAt" FROM quotation_templates');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quotation-templates', async (req, res) => {
  try {
    const template = req.body;
    const result = await query(`
      INSERT INTO quotation_templates (title, description, line_items, total)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, line_items AS "lineItems", total, created_at AS "createdAt"
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

router.put('/quotation-templates/:id', async (req, res) => {
  try {
    const template = req.body;
    await query(`
      UPDATE quotation_templates SET title = $1, description = $2, line_items = $3, total = $4
      WHERE id = $5
    `, [
      template.title,
      template.description,
      JSON.stringify(template.lineItems || []),
      template.total,
      req.params.id
    ]);
    const result = await query('SELECT id, title, description, line_items AS "lineItems", total, created_at AS "createdAt" FROM quotation_templates WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/quotation-templates/:id', async (req, res) => {
  try {
    await query('DELETE FROM quotation_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activity Log routes
router.get('/activity-log', async (req, res) => {
  try {
    const result = await query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/activity-log', async (req, res) => {
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
router.get('/payment-activity-log', async (req, res) => {
  try {
    const result = await query('SELECT * FROM payment_activity_log ORDER BY timestamp DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/payment-activity-log', async (req, res) => {
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
router.get('/notifications', async (req, res) => {
  try {
    const result = await query('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications', async (req, res) => {
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

router.put('/notifications/mark-all-read', async (req, res) => {
  try {
    await query(`
      UPDATE notifications SET read = true 
      WHERE "recipientUserIds"::jsonb @> $1::jsonb 
      OR recipient_roles::jsonb @> $2::jsonb
    `, [JSON.stringify([req.user.id]), JSON.stringify([req.user.role])]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
