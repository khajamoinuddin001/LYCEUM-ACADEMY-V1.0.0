import express from 'express';
import { query, getClient } from '../database.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// Routes are protected individually with authenticateToken middleware

// Configure multer for memory storage
import multer from 'multer';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Configure multer for disk storage (avatars)
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
import path from 'path';

// Document routes
router.post('/documents', authenticateToken, async (req, res) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });

      const contactId = parseInt(req.body.contactId);
      const isPrivate = req.body.isPrivate === 'true';
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'Invalid contact ID' });
      }

      // Check permissions:
      // Admin or users with Contacts update can upload to anyone.
      // Everyone else (including Students) can ONLY upload to their OWN contact record.
      const canUpdateAnyContact = req.user.role === 'Admin' || !!req.user.permissions?.['Contacts']?.update;
      const isStudent = req.user.role === 'Student';

      // Students cannot upload private documents
      if (isStudent && isPrivate) {
        return res.status(403).json({ error: 'Unauthorized: Students cannot upload private documents.' });
      }

      if (!canUpdateAnyContact) {
        // Verify ownership of contact
        const contactRes = await query('SELECT user_id FROM contacts WHERE id = $1', [contactId]);
        if (contactRes.rows.length === 0) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        const ownerUserId = contactRes.rows[0].user_id;

        // Strictly check if the current user is the owner
        if (ownerUserId !== req.user.id) {
          return res.status(403).json({ error: 'Unauthorized: You can only upload documents to your own record.' });
        }
      }

      const result = await query(`
        INSERT INTO documents (contact_id, name, type, size, content, is_private)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, contact_id, name, type, size, uploaded_at, is_private
      `, [contactId, file.originalname, file.mimetype, file.size, file.buffer, isPrivate]);

      res.json(result.rows[0]);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 1, text: 'University Checklist - documents', type: 'checkbox', completed: false, isDefault: true },
  { id: 2, text: 'University Checklist - university applied', type: 'checkbox', completed: false, isDefault: true },
  { id: 3, text: 'University Checklist - Remark', type: 'text', completed: false, response: '', isDefault: true },
  { id: 4, text: 'DS 160 - DS 160 started', type: 'checkbox', completed: false, isDefault: true },
  { id: 5, text: 'DS 160 - DS 160 filled', type: 'checkbox', completed: false, isDefault: true },
  { id: 6, text: 'DS 160 - DS 160 submitted', type: 'checkbox', completed: false, isDefault: true },
  { id: 7, text: 'CGI - credentials created', type: 'checkbox', completed: false, isDefault: true },
  { id: 8, text: 'CGI - paid interview fees', type: 'checkbox', completed: false, isDefault: true },
  { id: 9, text: 'CGI - ready to book slot', type: 'checkbox', completed: false, isDefault: true },
  { id: 10, text: 'Sevis fee - sevis fee received', type: 'checkbox', completed: false, isDefault: true },
  { id: 11, text: 'Sevis fee - sevis fee paid', type: 'checkbox', completed: false, isDefault: true },
  { id: 12, text: 'Visa Interview Preparation - sevis fee received', type: 'checkbox', completed: false, isDefault: true },
  { id: 13, text: 'Visa Interview Preparation - online classes', type: 'checkbox', completed: false, isDefault: true },
  { id: 14, text: 'Post visa guidance - projects', type: 'checkbox', completed: false, isDefault: true }
];

router.get('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];

    // Check if document is private and user is student
    if (doc.is_private && req.user.role === 'Student') {
      return res.status(403).json({ error: 'Unauthorized: Restricted document' });
    }

    // Students can download only their own documents
    if (req.user.role === 'Student') {
      const contactRes = await query('SELECT user_id FROM contacts WHERE id = $1', [doc.contact_id]);
      if (contactRes.rows.length === 0 || contactRes.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (!req.user.permissions?.['Contacts']?.read && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
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
    // Students can list only their own contact's documents
    if (req.user.role === 'Student') {
      const contactRes = await query('SELECT user_id FROM contacts WHERE id = $1', [req.params.id]);
      if (contactRes.rows.length === 0 || contactRes.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (!req.user.permissions?.['Contacts']?.read && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let queryText = 'SELECT id, contact_id, name, type, size, uploaded_at, is_private FROM documents WHERE contact_id = $1';

    // Filter private docs for students
    if (req.user.role === 'Student') {
      queryText += ' AND (is_private IS NULL OR is_private = false)';
    }

    queryText += ' ORDER BY uploaded_at DESC';

    const result = await query(queryText, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Users routes
router.get('/users', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, phone, role, permissions, must_reset_password, created_at, shift_start, shift_end, working_days, joining_date, base_salary FROM users');
    res.json(result.rows.map(user => ({
      ...user,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions || '{}') : (user.permissions || {}),
      workingDays: typeof user.working_days === 'string' ? JSON.parse(user.working_days || '[]') : (user.working_days || []),
      shiftStart: user.shift_start,
      shiftEnd: user.shift_end,
      mustResetPassword: user.must_reset_password
    })));
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
      INSERT INTO users (name, email, phone, password, role, permissions)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, role, permissions
    `, [name, email.toLowerCase(), req.body.phone || null, hashedPassword, role, JSON.stringify({})]);

    const user = result.rows[0];
    if (user && typeof user.permissions === 'string') {
      user.permissions = JSON.parse(user.permissions);
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const userIdToUpdate = parseInt(req.params.id);

    // Permission Check:
    // Only Admin can update other users' roles/permissions.
    // Users can update their own profile (name, email, password) but NOT role/permissions.
    const isSelf = req.user.id === userIdToUpdate;
    const isAdmin = req.user.role === 'Admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { name, email, phone, role, permissions, newPassword, joining_date, base_salary, shift_start, shift_end, working_days } = req.body;

    // If not admin, prevent role/permission/salary changes
    if (!isAdmin) {
      // In a real app we'd fetch current and only allowed updates
    }

    const updates = [];
    const values = [];
    let pCount = 1;

    const addUpdate = (col, val) => {
      if (val !== undefined) {
        updates.push(`${col} = $${pCount++}`);
        values.push(val);
      }
    };

    addUpdate('name', name);
    addUpdate('email', email);
    addUpdate('phone', phone);
    if (isAdmin) {
      addUpdate('role', role);
      if (permissions) addUpdate('permissions', JSON.stringify(permissions));
      addUpdate('joining_date', joining_date);
      addUpdate('base_salary', base_salary);
      addUpdate('shift_start', shift_start);

      addUpdate('shift_end', shift_end);
      addUpdate('working_days', working_days ? JSON.stringify(working_days) : undefined);
    }

    if (newPassword) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      addUpdate('password', hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    values.push(userIdToUpdate);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${pCount} RETURNING id, name, email, role, permissions, must_reset_password, joining_date, base_salary, shift_start, shift_end, working_days`,
      values
    );

    const user = result.rows[0];
    if (user && user.permissions) {
      user.permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    }
    if (user) {
      user.mustResetPassword = user.must_reset_password;
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to transform contact from DB format to API format
const transformContact = (dbContact) => {
  if (!dbContact) return null;
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
    avatarUrl: dbContact.avatar_url,
    createdAt: dbContact.created_at,
    // JSON fields
    checklist: (() => {
      try {
        const parsed = Array.isArray(dbContact.checklist) ? dbContact.checklist : JSON.parse(dbContact.checklist || '[]');
        return (Array.isArray(parsed) && parsed.length > 0) ? parsed : DEFAULT_CHECKLIST_ITEMS;
      } catch {
        return DEFAULT_CHECKLIST_ITEMS;
      }
    })(),
    activityLog: Array.isArray(dbContact.activity_log) ? dbContact.activity_log : JSON.parse(dbContact.activity_log || '[]'),
    recordedSessions: Array.isArray(dbContact.recorded_sessions) ? dbContact.recorded_sessions : JSON.parse(dbContact.recorded_sessions || '[]'),
    documents: Array.isArray(dbContact.documents) ? dbContact.documents : JSON.parse(dbContact.documents || '[]'),
    visaInformation: typeof dbContact.visa_information === 'object' ? dbContact.visa_information : JSON.parse(dbContact.visa_information || '{}'),
    lmsProgress: typeof dbContact.lms_progress === 'object' ? dbContact.lms_progress : JSON.parse(dbContact.lms_progress || '{}'),
    lmsNotes: typeof dbContact.lms_notes === 'object' ? dbContact.lms_notes : JSON.parse(dbContact.lms_notes || '{}'),
    courses: Array.isArray(dbContact.courses) ? dbContact.courses : JSON.parse(dbContact.courses || '[]'),
    metadata: typeof dbContact.metadata === 'object' ? dbContact.metadata : JSON.parse(dbContact.metadata || '{}')
  };
  return contact;
};

// Delete document
router.delete('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    // Get document info first
    const docResult = await query('SELECT * FROM documents WHERE id = $1', [documentId]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];

    // Delete from database
    await query('DELETE FROM documents WHERE id = $1', [documentId]);

    // Also remove from contact's documents array if needed
    if (document.contact_id) {
      const contactResult = await query('SELECT documents FROM contacts WHERE id = $1', [document.contact_id]);
      if (contactResult.rows.length > 0) {
        const contact = contactResult.rows[0];
        const updatedDocs = (contact.documents || []).filter((doc) => doc.id !== documentId);
        await query('UPDATE contacts SET documents = $1 WHERE id = $2', [JSON.stringify(updatedDocs), document.contact_id]);
      }
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve avatar from DB
router.get('/contacts/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT avatar_data, avatar_mimetype FROM contacts WHERE id = $1', [id]);

    if (result.rows.length === 0 || !result.rows[0].avatar_data) {
      return res.status(404).send('Avatar not found');
    }

    const { avatar_data, avatar_mimetype } = result.rows[0];
    res.setHeader('Content-Type', avatar_mimetype || 'image/jpeg');
    res.send(avatar_data);
  } catch (error) {
    console.error('Error serving avatar:', error);
    res.status(500).send('Error serving avatar');
  }
});

// Photo upload route (DB Storage)
router.post('/contacts/:id/photo', authenticateToken, uploadAvatar.single('photo'), async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const file = req.file;
    const avatarUrl = `/contacts/${contactId}/avatar?t=${Date.now()}`;

    // Update avatar_data, mimetype, and set the URL to point to our serving endpoint
    const result = await query(
      'UPDATE contacts SET avatar_url = $1, avatar_data = $2, avatar_mimetype = $3 WHERE id = $4 RETURNING avatar_url',
      [avatarUrl, file.buffer, file.mimetype, contactId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true, avatarUrl: result.rows[0].avatar_url });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Contacts routes
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM contacts';
    let params = [];

    // RBAC: Students only see their own contact record
    if (req.user.role === 'Student') {
      sql = 'SELECT * FROM contacts WHERE user_id = $1';
      params = [req.user.id];

      const result = await query(sql, params);

      // Auto-create contact if student doesn't have one
      if (result.rows.length === 0) {
        console.log(`📝 Auto - creating contact for student user ${req.user.id} (${req.user.email})`);

        const contactId = `LA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(req.user.id).padStart(3, '0')} `;
        const defaultChecklist = DEFAULT_CHECKLIST_ITEMS;

        const createResult = await query(`
          INSERT INTO contacts(user_id, name, email, contact_id, department, major, notes, checklist, activity_log, recorded_sessions)
VALUES($1, $2, $3, $4, 'Unassigned', 'Unassigned', $5, $6, '[]', '[]')
RETURNING *
  `, [
          req.user.id,
          req.user.email.split('@')[0], // Use email prefix as name if not available
          req.user.email,
          contactId,
          `Student contact auto - created on ${new Date().toLocaleDateString()}.`,
          JSON.stringify(defaultChecklist)
        ]);

        const transformedContacts = createResult.rows.map(transformContact);
        return res.json(transformedContacts);
      }

      const transformedContacts = await Promise.all(result.rows.map(async (contact) => {
        const transformed = transformContact(contact);
        if (transformed.counselorAssigned) {
          const counselorRes = await query('SELECT email, phone, shift_start, shift_end, working_days FROM users WHERE name = $1', [transformed.counselorAssigned]);
          if (counselorRes.rows.length > 0) {
            const cUser = counselorRes.rows[0];
            transformed.counselorDetails = {
              email: cUser.email,
              phone: cUser.phone,
              shiftStart: cUser.shift_start,
              shiftEnd: cUser.shift_end,
              workingDays: cUser.working_days // DB stores as JSON string or array? Schema says "working_days TEXT" or array?
            };
            // Need to handle working_days parsing if it's stored as JSON string in DB but returned as string
            try {
              if (typeof cUser.working_days === 'string') {
                transformed.counselorDetails.workingDays = JSON.parse(cUser.working_days);
              }
            } catch (e) { }
          }
        }
        return transformed;
      }));
      return res.json(transformedContacts);
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
      const datePrefix = `LA${yy}${mm}${dd} `;

      // Find highest sequence for today
      const todayContacts = await query(
        "SELECT contact_id FROM contacts WHERE contact_id LIKE $1 ORDER BY contact_id DESC LIMIT 1",
        [`${datePrefix}% `]
      );

      let sequence = 0;
      if (todayContacts.rows.length > 0) {
        const lastId = todayContacts.rows[0].contact_id;
        sequence = parseInt(lastId.slice(-3)) + 1;
      }

      contactId = `${datePrefix}${String(sequence).padStart(3, '0')} `;
    }

    const result = await query(`
      INSERT INTO contacts(
    user_id, name, contact_id, email, phone, department, major, notes, file_status,
    agent_assigned, checklist, activity_log, recorded_sessions, documents, visa_information,
    lms_progress, lms_notes, gpa, advisor, courses, street1, street2, city, state, zip,
    country, gstin, pan, tags, visa_type, country_of_application, source, contact_type,
    stream, intake, counselor_assigned, application_email, application_password, avatar_url, metadata
  ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40)
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
      contact.applicationPassword || null,
      contact.avatarUrl || null,
      JSON.stringify(contact.metadata || {})
    ]);
    res.json(transformContact(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete Contact
router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);

    // Permission check
    if (req.user.role !== 'Admin' && req.user.role !== 'Staff') {
      // Students cannot delete contacts? Or maybe they can?
      // Usually only Admin/Staff should delete.
      if (req.user.role !== 'Admin' && (!req.user.permissions || !req.user.permissions['Contacts']?.delete)) {
        return res.status(403).json({ error: 'Permission denied' });
      }
    }

    // Check if contact exists
    const check = await query('SELECT * FROM contacts WHERE id = $1', [contactId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    const contact = check.rows[0];

    // Delete contact first
    await query('DELETE FROM contacts WHERE id = $1', [contactId]);

    // If contact has a linked user, delete the user account as well
    if (contact.user_id) {
      await query('DELETE FROM users WHERE id = $1', [contact.user_id]);
      console.log(`Associated user account (ID: ${contact.user_id}) deleted for contact ${contactId}`);
    }

    res.json({ success: true, message: 'Contact and associated user account deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contact = req.body;

    // Get the old contact data to check if name changed
    const oldContactResult = await query('SELECT name, email, user_id FROM contacts WHERE id = $1', [req.params.id]);
    const oldContact = oldContactResult.rows[0];
    const nameChanged = oldContact && oldContact.name !== contact.name;

    // Update the contact
    await query(`
      UPDATE contacts SET
name = $1, email = $2, phone = $3, department = $4, major = $5, notes = $6,
  file_status = $7, agent_assigned = $8, checklist = $9, activity_log = $10,
  recorded_sessions = $11, documents = $12, visa_information = $13, lms_progress = $14,
  lms_notes = $15, gpa = $16, advisor = $17, courses = $18, street1 = $19, street2 = $20,
  city = $21, state = $22, zip = $23, country = $24, gstin = $25, pan = $26, tags = $27,
  visa_type = $28, country_of_application = $29, source = $30, contact_type = $31,
  stream = $32, intake = $33, counselor_assigned = $34, application_email = $35,
  application_password = $36, metadata = $37
      WHERE id = $38
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
      JSON.stringify(contact.metadata || {}),
      req.params.id
    ]);

    // If name changed, cascade the update to related records
    if (nameChanged) {
      console.log(`📝 Contact name changed from "${oldContact.name}" to "${contact.name}". Syncing across system...`);

      // 1. Update user name if this contact has a linked user account
      if (oldContact.user_id) {
        await query('UPDATE users SET name = $1 WHERE id = $2', [contact.name, oldContact.user_id]);
        console.log(`✅ Updated user name for user_id: ${oldContact.user_id}`);
      }

      // 2. Update CRM leads where this contact is the contact person
      const leadsResult = await query('UPDATE leads SET contact = $1 WHERE email = $2 OR phone = $3 RETURNING id',
        [contact.name, oldContact.email, contact.phone]);
      if (leadsResult.rows.length > 0) {
        console.log(`✅ Updated ${leadsResult.rows.length} CRM lead(s)`);
      }

      // 3. Update accounting transactions (customer_name)
      const transactionsResult = await query('UPDATE transactions SET customer_name = $1 WHERE contact_id = $2 RETURNING id',
        [contact.name, req.params.id]);
      if (transactionsResult.rows.length > 0) {
        console.log(`✅ Updated ${transactionsResult.rows.length} transaction(s)`);
      }

      // 4. Update visitors
      const visitorsResult = await query('UPDATE visitors SET name = $1 WHERE contact_id = $2 RETURNING id',
        [contact.name, req.params.id]);
      if (visitorsResult.rows.length > 0) {
        console.log(`✅ Updated ${visitorsResult.rows.length} visitor record(s)`);
      }

      console.log(`✅ Name sync complete for contact ID: ${req.params.id}`);
    }

    const result = await query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    res.json(transformContact(result.rows[0]));
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Merge contacts - combines two contacts into one
router.post('/contacts/:id/merge', authenticateToken, async (req, res) => {
  try {
    const primaryId = parseInt(req.params.id);
    const { targetContactId } = req.body;

    if (!targetContactId) {
      return res.status(400).json({ error: 'Target contact ID is required' });
    }

    // Fetch both contacts
    const [primaryResult, targetResult] = await Promise.all([
      query('SELECT * FROM contacts WHERE id = $1', [primaryId]),
      query('SELECT * FROM contacts WHERE id = $1', [targetContactId])
    ]);

    if (primaryResult.rows.length === 0 || targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'One or both contacts not found' });
    }

    const primary = primaryResult.rows[0];
    const target = targetResult.rows[0];

    console.log(`🔄 Merging contact ${targetContactId} into ${primaryId}`);

    // Helper: Deduplicate documents by filename
    const deduplicateDocuments = (docs) => {
      const seen = new Set();
      return docs.filter(doc => {
        if (seen.has(doc.filename || doc.name)) return false;
        seen.add(doc.filename || doc.name);
        return true;
      });
    };

    // Helper: Merge checklists
    const mergeChecklists = (list1, list2) => {
      const merged = [...(list1 || [])];
      const existingTexts = new Set(merged.map(item => item.text));

      (list2 || []).forEach(item => {
        if (!existingTexts.has(item.text)) {
          merged.push(item);
        }
      });
      return merged;
    };

    // Merge data - prioritize primary, add missing from target
    const mergedData = {
      name: primary.name || target.name,
      email: primary.email || target.email,
      phone: primary.phone || target.phone,
      department: primary.department || target.department,
      major: primary.major || target.major,
      notes: [primary.notes, target.notes].filter(Boolean).join('\n\n'),
      file_status: primary.file_status || target.file_status,
      agent_assigned: primary.agent_assigned || target.agent_assigned,

      // Merge arrays
      checklist: mergeChecklists(
        typeof primary.checklist === 'string' ? JSON.parse(primary.checklist) : primary.checklist,
        typeof target.checklist === 'string' ? JSON.parse(target.checklist) : target.checklist
      ),

      activity_log: [
        ...(typeof primary.activity_log === 'string' ? JSON.parse(primary.activity_log || '[]') : (primary.activity_log || [])),
        ...(typeof target.activity_log === 'string' ? JSON.parse(target.activity_log || '[]') : (target.activity_log || []))
      ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)),

      recorded_sessions: [
        ...(typeof primary.recorded_sessions === 'string' ? JSON.parse(primary.recorded_sessions || '[]') : (primary.recorded_sessions || [])),
        ...(typeof target.recorded_sessions === 'string' ? JSON.parse(target.recorded_sessions || '[]') : (target.recorded_sessions || []))
      ],

      documents: deduplicateDocuments([
        ...(typeof primary.documents === 'string' ? JSON.parse(primary.documents || '[]') : (primary.documents || [])),
        ...(typeof target.documents === 'string' ? JSON.parse(target.documents || '[]') : (target.documents || []))
      ]),

      // Merge visa information (objects)
      visa_information: {
        ...(typeof target.visa_information === 'string' ? JSON.parse(target.visa_information || '{}') : (target.visa_information || {})),
        ...(typeof primary.visa_information === 'string' ? JSON.parse(primary.visa_information || '{}') : (primary.visa_information || {}))
      },

      lms_progress: {
        ...(typeof target.lms_progress === 'string' ? JSON.parse(target.lms_progress || '{}') : (target.lms_progress || {})),
        ...(typeof primary.lms_progress === 'string' ? JSON.parse(primary.lms_progress || '{}') : (primary.lms_progress || {}))
      },

      lms_notes: {
        ...(typeof target.lms_notes === 'string' ? JSON.parse(target.lms_notes || '{}') : (target.lms_notes || {})),
        ...(typeof primary.lms_notes === 'string' ? JSON.parse(primary.lms_notes || '{}') : (primary.lms_notes || {}))
      },

      courses: [
        ...(typeof primary.courses === 'string' ? JSON.parse(primary.courses || '[]') : (primary.courses || [])),
        ...(typeof target.courses === 'string' ? JSON.parse(target.courses || '[]') : (target.courses || []))
      ],

      // Address fields
      street1: primary.street1 || target.street1,
      street2: primary.street2 || target.street2,
      city: primary.city || target.city,
      state: primary.state || target.state,
      zip: primary.zip || target.zip,
      country: primary.country || target.country,

      // Other fields
      gstin: primary.gstin || target.gstin,
      pan: primary.pan || target.pan,
      tags: primary.tags || target.tags,
      visa_type: primary.visa_type || target.visa_type,
      country_of_application: primary.country_of_application || target.country_of_application,
      source: primary.source || target.source,
      contact_type: primary.contact_type || target.contact_type,
      stream: primary.stream || target.stream,
      intake: primary.intake || target.intake,
      counselor_assigned: primary.counselor_assigned || target.counselor_assigned,
      application_email: primary.application_email || target.application_email,
      application_password: primary.application_password || target.application_password,
      gpa: primary.gpa || target.gpa,
      advisor: primary.advisor || target.advisor,

      // Preserve user link from either
      user_id: primary.user_id || target.user_id
    };

    // Update primary contact with merged data
    await query(`
      UPDATE contacts SET
        name = $1, email = $2, phone = $3, department = $4, major = $5, notes = $6,
        file_status = $7, agent_assigned = $8, checklist = $9, activity_log = $10,
        recorded_sessions = $11, documents = $12, visa_information = $13, lms_progress = $14,
        lms_notes = $15, gpa = $16, advisor = $17, courses = $18, street1 = $19, street2 = $20,
        city = $21, state = $22, zip = $23, country = $24, gstin = $25, pan = $26, tags = $27,
        visa_type = $28, country_of_application = $29, source = $30, contact_type = $31,
        stream = $32, intake = $33, counselor_assigned = $34, application_email = $35,
        application_password = $36, user_id = $37
      WHERE id = $38
    `, [
      mergedData.name, mergedData.email, mergedData.phone, mergedData.department, mergedData.major, mergedData.notes,
      mergedData.file_status, mergedData.agent_assigned, JSON.stringify(mergedData.checklist), JSON.stringify(mergedData.activity_log),
      JSON.stringify(mergedData.recorded_sessions), JSON.stringify(mergedData.documents), JSON.stringify(mergedData.visa_information),
      JSON.stringify(mergedData.lms_progress), JSON.stringify(mergedData.lms_notes), mergedData.gpa, mergedData.advisor,
      JSON.stringify(mergedData.courses), mergedData.street1, mergedData.street2, mergedData.city, mergedData.state,
      mergedData.zip, mergedData.country, mergedData.gstin, mergedData.pan, mergedData.tags, mergedData.visa_type,
      mergedData.country_of_application, mergedData.source, mergedData.contact_type, mergedData.stream, mergedData.intake,
      mergedData.counselor_assigned, mergedData.application_email, mergedData.application_password, mergedData.user_id,
      primaryId
    ].map(val => val === undefined ? null : val));

    // Update all related records to point to primary contact
    const recordsUpdated = {};

    // Update visitors
    const visitorsResult = await query('UPDATE visitors SET contact_id = $1 WHERE contact_id = $2 RETURNING id', [primaryId, targetContactId]);
    recordsUpdated.visitors = visitorsResult.rows.length;

    // Update transactions
    const transactionsResult = await query('UPDATE transactions SET contact_id = $1 WHERE contact_id = $2 RETURNING id', [primaryId, targetContactId]);
    recordsUpdated.transactions = transactionsResult.rows.length;

    // Update leads - leads table uses contact name, not contact_id
    const leadsResult = await query('UPDATE leads SET contact = $1 WHERE contact = $2 OR email = $3 OR phone = $4 RETURNING id',
      [mergedData.name, target.name, target.email, target.phone]);
    recordsUpdated.leads = leadsResult.rows.length;

    // If target had a user link, update user to point to primary contact
    if (target.user_id && !primary.user_id) {
      await query('UPDATE users SET name = $1 WHERE id = $2', [mergedData.name, target.user_id]);
      console.log(`✅ Updated user ${target.user_id} to link with primary contact`);
    }

    // Delete target contact
    await query('DELETE FROM contacts WHERE id = $1', [targetContactId]);

    console.log(`✅ Merge complete: ${recordsUpdated.visitors} visitors, ${recordsUpdated.transactions} transactions, ${recordsUpdated.leads} leads updated`);

    // Fetch and return merged contact
    const finalResult = await query('SELECT * FROM contacts WHERE id = $1', [primaryId]);

    res.json({
      success: true,
      mergedContact: transformContact(finalResult.rows[0]),
      recordsUpdated
    });
  } catch (error) {
    console.error('Error merging contacts:', error);
    res.status(500).json({ error: error.message });
  }
});


// Helper to transform lead keys
const transformLead = (lead) => {
  const { assignedTo, createdAt, ...rest } = lead;
  return {
    ...rest,
    assignedTo: assignedTo || lead.assigned_to,
    createdAt: createdAt || lead.created_at
  };
};

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
    await query('DELETE FROM contacts WHERE user_id = $1', [userIdToDelete]);

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

router.get('/leads', authenticateToken, async (req, res) => {
  try {
    // If student, return only their leads
    if (req.user.role === 'Student') {
      // Get student contact to match name
      const contactRes = await query('SELECT * FROM contacts WHERE user_id = $1', [req.user.id]);
      const contact = contactRes.rows[0];

      if (!contact) {
        return res.json([]);
      }

      // Match by User Email OR Contact Name
      const result = await query(`
        SELECT * FROM leads 
        WHERE (email IS NOT NULL AND LOWER(email) = LOWER($1))
           OR (contact IS NOT NULL AND LOWER(contact) = LOWER($2))
        ORDER BY created_at DESC
      `, [req.user.email || '', contact.name || '']);

      return res.json(result.rows.map(transformLead));
    }

    // For others, strictly require Admin/Staff
    if (req.user.role !== 'Admin' && req.user.role !== 'Staff') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query('SELECT * FROM leads ORDER BY created_at DESC');
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
      INSERT INTO leads(title, company, value, contact, stage, email, phone, source, assigned_to, notes, quotations)
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
    const datePrefix = `LA${yy}${mm}${dd} `;

    const todayContacts = await query(
      "SELECT contact_id FROM contacts WHERE contact_id LIKE $1 ORDER BY contact_id DESC LIMIT 1",
      [`${datePrefix}% `]
    );

    let sequence = 0;
    if (todayContacts.rows.length > 0) {
      const lastId = todayContacts.rows[0].contact_id;
      sequence = parseInt(lastId.slice(-3)) + 1;
    }
    const newContactId = `${datePrefix}${String(sequence).padStart(3, '0')} `;

    // Insert Contact
    await query(`
      INSERT INTO contacts(
    name, contact_id, email, phone, department, major, notes, source, contact_type, checklist, created_at
  ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      lead.contact, // Contact Name
      newContactId,
      lead.email || null,
      lead.phone || null,
      'Unassigned',
      'Unassigned',
      `Auto - created from Lead: ${lead.title} `,
      lead.source || 'CRM Lead',
      'Lead',
      JSON.stringify(DEFAULT_CHECKLIST_ITEMS)
    ]);

    // 3. Send Notification
    if (lead.assignedTo) {
      // Find user ID by name (assignedTo is name string)
      const assignedUserResult = await query('SELECT id FROM users WHERE name = $1', [lead.assignedTo]);
      if (assignedUserResult.rows.length > 0) {
        const userId = assignedUserResult.rows[0].id;
        await query(`
          INSERT INTO notifications(title, description, read, link_to, recipient_user_ids, timestamp)
VALUES($1, $2, $3, $4, $5, NOW())
        `, [
          'New Lead Assigned',
          `You have been assigned a new lead: ${lead.title} `,
          false,
          JSON.stringify({ type: 'lead', id: newLead.id }),
          JSON.stringify([userId])
        ]);
      }
    }

    res.json(transformLead(newLead));
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public Enquiry Route - No Authentication Required
router.post('/public/enquiries', async (req, res) => {
  try {
    const enquiry = req.body;

    // 1. Create Lead from Enquiry
    const leadResult = await query(`
      INSERT INTO leads(title, company, value, contact, stage, email, phone, source, assigned_to, notes, quotations)
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *
  `, [
      `Website Enquiry: ${enquiry.name} `,  // Title
      'Individual',                        // Company
      0,                                   // Value
      enquiry.name,                        // Contact Name
      'New',                               // Stage
      enquiry.email,                       // Email
      enquiry.phone,                       // Phone
      'Website',                           // Source
      null,                                // Assigned To
      `Interest: ${enquiry.interest}.Country: ${enquiry.country}.Message: ${enquiry.message} `, // Notes
      JSON.stringify([])                   // Quotations
    ]);

    const newLead = leadResult.rows[0];

    // 2. Automatically Create a Contact
    // Generate Contact ID
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `LA${yy}${mm}${dd} `;

    const todayContacts = await query(
      "SELECT contact_id FROM contacts WHERE contact_id LIKE $1 ORDER BY contact_id DESC LIMIT 1",
      [`${datePrefix}% `]
    );

    let sequence = 0;
    if (todayContacts.rows.length > 0) {
      const lastId = todayContacts.rows[0].contact_id;
      sequence = parseInt(lastId.slice(-3)) + 1;
    }
    const newContactId = `${datePrefix}${String(sequence).padStart(3, '0')} `;

    // Insert Contact
    await query(`
      INSERT INTO contacts(
    name, contact_id, email, phone, department, major, notes, source, contact_type, checklist, created_at
  ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      enquiry.name,
      newContactId,
      enquiry.email,
      enquiry.phone,
      'Unassigned',
      'Unassigned',
      `Auto - created from Website Enquiry: ${enquiry.interest} `,
      'Website',
      'Lead',
      JSON.stringify([{ id: 0, text: 'Initial Inquiry Received', completed: true, type: 'checkbox' }])
    ]);

    // 3. Notify Admins (Optional - typically leads are unassigned initially)
    // You could query all admins and notify them here if desired.

    res.json({ success: true, message: 'Enquiry received successfully' });
  } catch (error) {
    console.error('Enquiry Error:', error);
    res.status(500).json({ error: 'Failed to process enquiry' });
  }
});

router.put('/leads/:id', authenticateToken, async (req, res) => {
  try {
    const lead = req.body;

    // Fetch current lead to preserve stage if not provided
    const currentLeadResult = await query('SELECT stage, quotations FROM leads WHERE id = $1', [req.params.id]);
    if (currentLeadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    const currentLead = currentLeadResult.rows[0];

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
      lead.stage || currentLead.stage,
      lead.email,
      lead.phone,
      lead.source,
      lead.assignedTo,
      lead.notes,
      JSON.stringify(lead.quotations || currentLead.quotations || []),
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
    const result = await query('SELECT * FROM transactions ORDER BY date DESC, id DESC');
    const transactions = result.rows.map(t => ({
      ...t,
      contactId: t.contact_id,
      customerName: t.customer_name, // Map snake_case to camelCase
      paymentMethod: t.payment_method,
      dueDate: t.due_date
    }));
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VENDORS ROUTES
router.get('/vendors', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM vendors ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vendors', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, gstin, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Vendor name is required' });

    const result = await query(`
      INSERT INTO vendors (name, email, phone, gstin, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email || null, phone || null, gstin || null, address || null]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PRODUCTS ROUTES
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const result = await query(`
      INSERT INTO products (name, description, price, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description || null, price || 0, type || 'Goods']);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EXPENSE PAYEES ROUTES
router.get('/expense-payees', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM expense_payees ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expense-payees', authenticateToken, async (req, res) => {
  try {
    const { name, defaultCategory } = req.body;
    if (!name) return res.status(400).json({ error: 'Payee name is required' });

    // Check if exists
    const existing = await query('SELECT * FROM expense_payees WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      // Update existing if needed, or just return it
      if (defaultCategory) {
        const updated = await query(
          'UPDATE expense_payees SET default_category = $1 WHERE id = $2 RETURNING *',
          [defaultCategory, existing.rows[0].id]
        );
        return res.json(updated.rows[0]);
      }
      return res.json(existing.rows[0]);
    }

    const result = await query(`
      INSERT INTO expense_payees (name, default_category)
      VALUES ($1, $2)
      RETURNING *
    `, [name, defaultCategory || null]);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions', authenticateToken, async (req, res) => {
  try {
    const transaction = req.body;
    const id = transaction.id || `${transaction.type === 'Bill' ? 'BILL' : 'INV'}-${String(Date.now()).slice(-6)}`;
    const result = await query(`
      INSERT INTO transactions(id, contact_id, customer_name, date, description, type, status, amount, payment_method, due_date)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id,
      transaction.contactId || null,
      transaction.customerName,
      transaction.date,
      transaction.description || null,
      transaction.type,
      transaction.status || 'Pending',
      transaction.amount,
      transaction.paymentMethod || null,
      transaction.dueDate || null
    ]);
    const newTransaction = result.rows[0];

    // Automatic AR Deduction for Invoices (and Income if linked to contact)
    // First, robustly determine contact ID
    let targetContactId = newTransaction.contact_id;

    if (!targetContactId && newTransaction.customer_name) {
      try {
        const nameRes = await query('SELECT id FROM contacts WHERE LOWER(name) = LOWER($1)', [newTransaction.customer_name]);
        if (nameRes.rows.length > 0) {
          targetContactId = nameRes.rows[0].id;
          console.log(`🔗 Linked Invoice ${newTransaction.id} to Contact ${targetContactId} by name "${newTransaction.customer_name}"`);
          // Optionally back-fill the transaction
          await query('UPDATE transactions SET contact_id = $1 WHERE id = $2', [targetContactId, newTransaction.id]);
        }
      } catch (linkError) {
        console.error('Failed to link contact by name:', linkError);
      }
    }

    if ((newTransaction.type === 'Invoice' || newTransaction.type === 'Income') && targetContactId) {
      try {
        const contactId = targetContactId;
        const contactRes = await query('SELECT metadata FROM contacts WHERE id = $1', [contactId]);

        if (contactRes.rows.length > 0) {
          const contact = contactRes.rows[0];
          let metadata = contact.metadata || {};

          // Ensure structure exists
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
          }
          if (!metadata.accountsReceivable) metadata.accountsReceivable = [];

          let amountToDeduct = parseFloat(newTransaction.amount);
          let arUpdated = false;

          // Process AR entries (FIFO)
          metadata.accountsReceivable = metadata.accountsReceivable.map(entry => {
            if (amountToDeduct <= 0 || entry.status === 'Paid') return entry;

            const remaining = parseFloat(entry.remainingAmount);
            if (remaining <= 0) return entry;

            let deduction = 0;
            if (remaining > amountToDeduct) {
              // Partial deduction of this entry, fully covers the invoice
              deduction = amountToDeduct;
              entry.remainingAmount = remaining - deduction;
              entry.paidAmount = (entry.paidAmount || 0) + deduction;
              amountToDeduct = 0;
            } else {
              // Fully deduct this entry, invoice might still have remainder
              deduction = remaining;
              entry.remainingAmount = 0;
              entry.paidAmount = (entry.paidAmount || 0) + deduction;
              entry.status = 'Paid';
              entry.paidAt = new Date().toISOString();
              amountToDeduct -= deduction;
            }
            arUpdated = true;
            return entry;
          });

          if (arUpdated) {
            await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), contactId]);
            console.log(`✅ Updated AR for Contact ${contactId} based on Invoice ${newTransaction.id}`);
          }
        }
      } catch (arError) {
        console.error('Failed to update Accounts Receivable:', arError);
        // Do not fail the transaction creation itself
      }
    }

    res.json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /transactions/:id - User:', req.user);
    console.log('PUT /transactions/:id - Body:', req.body);
    console.log('PUT /transactions/:id - Params:', req.params);

    const transaction = req.body;
    await query(`
      UPDATE transactions SET
      contact_id = $1, customer_name = $2, date = $3, description = $4, type = $5, status = $6, amount = $7, payment_method = $8, due_date = $9, additional_discount = $10
      WHERE id = $11
    `, [
      transaction.contactId || null,
      transaction.customerName,
      transaction.date,
      transaction.description,
      transaction.type,
      transaction.status,
      transaction.amount,
      transaction.paymentMethod,
      transaction.dueDate || null,
      transaction.additionalDiscount || 0,
      req.params.id
    ]);
    const result = await query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT /transactions/:id - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
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
      INSERT INTO events(title, start, "end", color, description)
VALUES($1, $2, $3, $4, $5)
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
    // Base query: JOIN with contacts to get contact_name
    let q = `
      SELECT tasks.*, contacts.name as contact_name 
      FROM tasks 
      LEFT JOIN contacts ON tasks.contact_id = contacts.id
    `;
    const params = [];

    if (req.user.role === 'Admin') {
      if (req.query.userId) {
        q += ' WHERE tasks.assigned_to = $1';
        params.push(req.query.userId);
      } else if (req.query.all !== 'true') {
        q += ' WHERE tasks.assigned_to = $1';
        params.push(req.user.id);
      }
    } else {
      // Find the contact associated with this user
      const contactRes = await query('SELECT id FROM contacts WHERE user_id = $1', [req.user.id]);
      const contactId = contactRes.rows[0]?.id;

      if (contactId) {
        q += ' WHERE (tasks.assigned_to = $1 OR tasks.contact_id = $2)';
        params.push(req.user.id, contactId);
      } else {
        q += ' WHERE tasks.assigned_to = $1';
        params.push(req.user.id);
      }
    }

    // Allow filtering by contactId if provided (and authorized)
    // Allow filtering by contactId if provided (and authorized)
    if (req.query.contactId) {
      // If contactId is provided, we fetch ALL tasks for that contact, regardless of who it is assigned to.
      // This is crucial for the CRM view where we want to see the full history.
      // We overwrite the query to focus on contact_id.
      // Note: We might want to keep some access control here, but for now assuming authenticated staff can see contact tasks.

      q = `
        SELECT tasks.*, contacts.name as contact_name 
        FROM tasks 
        LEFT JOIN contacts ON tasks.contact_id = contacts.id
        WHERE tasks.contact_id = $1
      `;
      // Reset params list to just have contactId
      while (params.length > 0) params.pop();
      params.push(req.query.contactId);
    }

    // Only apply assigned_to filter if contactId is NOT provided (default behavior)
    else {
      // Logic already built in 'q' initialization above (lines 1553-1573) is fine for default view
    }

    q += ' ORDER BY created_at DESC';
    const result = await query(q, params);
    res.json(result.rows.map(transformTask));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const task = req.body;

    // Generate unique Task ID
    let taskId;
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit number (10000-99999)
      taskId = `TSK-${randomNum}`;

      // Check if this ID already exists
      const existing = await query('SELECT id FROM tasks WHERE task_id = $1', [taskId]);
      if (existing.rows.length === 0) {
        isUnique = true;
      }
    }

    const result = await query(`
      INSERT INTO tasks(
        task_id, title, description, due_date, status, assigned_to, assigned_by, priority, replies, contact_id, activity_type
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      taskId,
      task.title,
      task.description,
      task.dueDate,
      task.status,
      task.assignedTo,
      req.user.id, // assigned_by
      task.priority || 'Medium',
      JSON.stringify([]), // replies
      task.contactId || null,
      task.activityType || null
    ]);
    res.json(transformTask(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transformation helper for tasks
const transformTask = (task) => ({
  ...task,
  taskId: task.task_id,
  dueDate: task.due_date,
  createdAt: task.created_at,
  assignedTo: task.assigned_to,
  assignedBy: task.assigned_by,
  completedBy: task.completed_by,
  completedAt: task.completed_at,
  contactId: task.contact_id,
  contactName: task.contact_name,
  activityType: task.activity_type
});


router.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = req.body;

    // If marking as done, record who and when
    let completedBy = null;
    let completedAt = null;

    if (task.status === 'done') {
      // Fetch existing task to check if it was already done
      const existing = await query('SELECT status FROM tasks WHERE id = $1', [req.params.id]);
      if (existing.rows.length > 0 && existing.rows[0].status !== 'done') {
        completedBy = req.user.id;
        completedAt = new Date().toISOString();
      }
    }

    let updateQuery = `
      UPDATE tasks SET
      title = $1, description = $2, due_date = $3, status = $4, assigned_to = $5, priority = $6
    `;
    const params = [
      task.title,
      task.description,
      task.dueDate,
      task.status,
      task.assignedTo,
      task.priority,
      req.params.id
    ];

    if (completedBy) {
      updateQuery += `, completed_by = $${params.length + 1}, completed_at = $${params.length + 2}`;
      params.push(completedBy, completedAt);
    }

    updateQuery += ` WHERE id = $${params.length + 1 - (completedBy ? 0 : 2)}`; // Adjust param index logic if needed, simpler to just overwrite params logic

    // Re-doing params construction for clarity
    const updateFields = [
      'title = $1', 'description = $2', 'due_date = $3', 'status = $4', 'assigned_to = $5', 'priority = $6', 'activity_type = $7'
    ];
    const updateParams = [
      task.title, task.description, task.dueDate, task.status, task.assignedTo, task.priority, task.activityType || null
    ];

    // Add replies if present
    if (task.replies !== undefined) {
      updateFields.push(`replies = $${updateParams.length + 1}`);
      updateParams.push(JSON.stringify(task.replies));
    }

    if (completedBy) {
      updateFields.push(`completed_by = $${updateParams.length + 1}`);
      updateParams.push(completedBy);
      updateFields.push(`completed_at = $${updateParams.length + 1}`);
      updateParams.push(completedAt);
    }

    // If status is NOT done, clear completion (optional, user asked?) - user said "record if done", implies history. 
    // If reopening, maybe clear? Let's assume reopening clears completion info for accurate current status.
    if (task.status !== 'done') {
      updateFields.push(`completed_by = NULL`);
      updateFields.push(`completed_at = NULL`);
    }

    updateParams.push(req.params.id);
    const finalQuery = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${updateParams.length}`;

    await query(finalQuery, updateParams);
    const result = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    res.json(transformTask(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TICKETS ROUTES =====

// Helper function to transform ticket from DB
const transformTicket = (ticket) => ({
  id: ticket.id,
  ticketId: ticket.ticket_id,
  contactId: ticket.contact_id,
  subject: ticket.subject,
  description: ticket.description,
  status: ticket.status,
  priority: ticket.priority,
  assignedTo: ticket.assigned_to,
  createdBy: ticket.created_by,
  resolutionNotes: ticket.resolution_notes,
  createdAt: ticket.created_at,
  updatedAt: ticket.updated_at
});

// Create ticket
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { contactId, subject, description, priority } = req.body;

    // Generate unique ticket ID
    let ticketId;
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
      ticketId = `TKT-${randomNum}`;

      const existing = await query('SELECT id FROM tickets WHERE ticket_id = $1', [ticketId]);
      if (existing.rows.length === 0) {
        isUnique = true;
      }
    }

    // Get contact's assigned counselor
    const contactResult = await query('SELECT counselor_assigned FROM contacts WHERE id = $1', [contactId]);
    let assignedTo = null;

    if (contactResult.rows.length > 0 && contactResult.rows[0].counselor_assigned) {
      // Find user ID by counselor name
      const counselorResult = await query('SELECT id FROM users WHERE name = $1', [contactResult.rows[0].counselor_assigned]);
      if (counselorResult.rows.length > 0) {
        assignedTo = counselorResult.rows[0].id;
      }
    }

    const result = await query(`
      INSERT INTO tickets(ticket_id, contact_id, subject, description, priority, assigned_to, created_by, status)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [ticketId, contactId, subject, description, priority || 'Medium', assignedTo, req.user.id, 'Open']);

    res.json(transformTicket(result.rows[0]));
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tickets (filtered by user role)
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    let queryText;
    let params = [];

    if (req.user.role === 'Admin') {
      // Admin sees all tickets
      queryText = `
        SELECT t.*, c.name as contact_name, u1.name as assigned_to_name, u2.name as created_by_name
        FROM tickets t
        LEFT JOIN contacts c ON t.contact_id = c.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        ORDER BY t.created_at DESC
      `;
    } else if (req.user.role === 'Staff') {
      // Staff sees tickets assigned to them
      queryText = `
        SELECT t.*, c.name as contact_name, u1.name as assigned_to_name, u2.name as created_by_name
        FROM tickets t
        LEFT JOIN contacts c ON t.contact_id = c.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.assigned_to = $1
        ORDER BY t.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'Student') {
      // Students see their own tickets
      const contactResult = await query('SELECT id FROM contacts WHERE user_id = $1', [req.user.id]);
      if (contactResult.rows.length === 0) {
        return res.json([]);
      }

      queryText = `
        SELECT t.*, c.name as contact_name, u1.name as assigned_to_name, u2.name as created_by_name
        FROM tickets t
        LEFT JOIN contacts c ON t.contact_id = c.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.contact_id = $1
        ORDER BY t.created_at DESC
      `;
      params = [contactResult.rows[0].id];
    }

    const result = await query(queryText, params);
    const tickets = result.rows.map(row => ({
      ...transformTicket(row),
      contactName: row.contact_name,
      assignedToName: row.assigned_to_name,
      createdByName: row.created_by_name
    }));

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single ticket
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, c.name as contact_name, u1.name as assigned_to_name, u2.name as created_by_name
      FROM tickets t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = {
      ...transformTicket(result.rows[0]),
      contactName: result.rows[0].contact_name,
      assignedToName: result.rows[0].assigned_to_name,
      createdByName: result.rows[0].created_by_name
    };

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket
router.put('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assignedTo, resolutionNotes } = req.body;

    const result = await query(`
      UPDATE tickets 
      SET status = $1, priority = $2, assigned_to = $3, resolution_notes = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [status, priority, assignedTo, resolutionNotes, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(transformTicket(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ticket
router.delete('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM tickets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== END TICKETS ROUTES =====


router.get('/staff-members', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role FROM users WHERE role IN ($1, $2)', ['Admin', 'Staff']);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff members for visitor assignment (Reception and Admin only)
router.get('/users/staff', authenticateToken, async (req, res) => {
  try {
    // Only Admin and Reception can access staff list
    if (req.user.role !== 'Admin' && !req.user.permissions?.['Reception']?.read) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT id, name, email, role, permissions FROM users WHERE role = $1 ORDER BY name ASC',
      ['Staff']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Channels routes
router.get('/channels', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
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

    // Check if channel already exists (for DM channels)
    const existingChannel = await query('SELECT * FROM channels WHERE id = $1', [id]);
    if (existingChannel.rows.length > 0) {
      return res.json(existingChannel.rows[0]);
    }

    const result = await query(`
      INSERT INTO channels(id, name, type, members, messages)
      VALUES($1, $2, $3, $4, $5)
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
    console.error('Error creating channel:', error);
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
      INSERT INTO coupons(code, discount_percentage, is_active, applicable_course_ids)
VALUES($1, $2, $3, $4)
      ON CONFLICT(code) DO UPDATE SET
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
    const id = course.id || `course - ${Date.now()} `;
    const result = await query(`
      INSERT INTO lms_courses(id, title, description, instructor, price, modules, discussions)
VALUES($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT(id) DO UPDATE SET
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
// Get visitors assigned to current staff member
router.get('/visitors/my-visitors', authenticateToken, async (req, res) => {
  try {
    // Staff can only see their own visitors
    if (req.user.role !== 'Staff' && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only staff members can access this endpoint' });
    }

    const statusFilter = req.query.status; // Optional: filter by status
    let queryText = 'SELECT * FROM visitors WHERE staff_email = $1';
    const params = [req.user.email];

    if (statusFilter) {
      queryText += ' AND status = $2';
      params.push(statusFilter);
    }

    queryText += ' ORDER BY check_in DESC, scheduled_check_in DESC';

    const result = await query(queryText, params);
    const visitors = result.rows.map(v => ({
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      dailySequenceNumber: v.daily_sequence_number,
      visitSegments: v.visit_segments || [],
      calledAt: v.called_at,
      staffEmail: v.staff_email,
      staffName: v.staff_name,
      createdAt: v.created_at
    }));
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/visitors', authenticateToken, async (req, res) => {
  try {
    // Resolve host ID to name if possible
    const result = await query(`
      SELECT v.*, u.name as host_name 
      FROM visitors v
      LEFT JOIN users u ON v.host = CAST(u.id AS TEXT)
    `);
    const visitors = result.rows.map(v => ({
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      dailySequenceNumber: v.daily_sequence_number,
      visitSegments: v.visit_segments || [],
      calledAt: v.called_at,
      staffEmail: v.staff_email,
      staffName: v.staff_name,
      createdAt: v.created_at
    }));
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visitors', authenticateToken, async (req, res) => {
  try {
    const visitor = req.body;
    let contactId = null;

    // 1. Check if contact exists by NAME (case-insensitive)
    const contactCheck = await query('SELECT id FROM contacts WHERE LOWER(name) = LOWER($1)', [visitor.name]);

    if (contactCheck.rows.length > 0) {
      // Found existing contact
      contactId = contactCheck.rows[0].id;
    } else {
      // Create NEW contact
      const newContactResult = await query(`
        INSERT INTO contacts(name, phone, source, department)
VALUES($1, $2, 'Reception', $3)
        RETURNING id
  `, [visitor.name, visitor.company, visitor.host]); // visitor.company is Mobile Number
      contactId = newContactResult.rows[0].id;
    }

    // 2. Determine Daily Sequence Number if checking in now
    let dailySequenceNumber = null;
    if (visitor.status === 'Checked-in' || (!visitor.status && visitor.checkIn)) {
      // It's a walk-in or immediate check-in
      const dateToCheck = visitor.checkIn ? new Date(visitor.checkIn) : new Date();
      // Format as YYYY-MM-DD for SQL comparison
      // Note: simple current_date is easiest for today. 
      // We will count visitors checked in TODAY.
      const seqResult = await query(`
        SELECT COUNT(*) as count 
        FROM visitors 
        WHERE daily_sequence_number IS NOT NULL 
        AND check_in:: date = CURRENT_DATE
  `);
      dailySequenceNumber = parseInt(seqResult.rows[0].count) + 1;
    }

    // 3. Create Visitor Record
    const result = await query(
      `INSERT INTO visitors(
    contact_id, name, company, host, purpose, scheduled_check_in, check_in, check_out, status, card_number, daily_sequence_number, visit_segments, staff_email, staff_name
  ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING * `,
      [
        contactId,
        visitor.name,
        visitor.company,
        visitor.host,
        visitor.purpose || null,
        visitor.scheduledCheckIn || null,
        visitor.checkIn || null,
        visitor.checkOut || null,
        visitor.status || 'Scheduled',
        visitor.cardNumber || null,
        dailySequenceNumber,
        JSON.stringify(visitor.visitSegments || []),
        visitor.staffEmail || null,
        visitor.staffName || null
      ]
    );
    const v = result.rows[0];
    res.json({
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      dailySequenceNumber: v.daily_sequence_number,
      visitSegments: v.visit_segments || [],
      calledAt: v.called_at,
      staffEmail: v.staff_email,
      staffName: v.staff_name,
      createdAt: v.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/contacts/:id/visits', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
SELECT * FROM visitors 
      WHERE contact_id = $1 
      ORDER BY created_at ASC
  `, [req.params.id]);

    const formattedVisits = result.rows.map(v => ({
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      dailySequenceNumber: v.daily_sequence_number,
      visitSegments: v.visit_segments || [],
      calledAt: v.called_at,
      createdAt: v.created_at
    }));

    res.json(formattedVisits);
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
      visitSegments: v.visit_segments || [],
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

    // Fetch current visitor to preserve existing values
    const currentResult = await query('SELECT * FROM visitors WHERE id = $1', [req.params.id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    const current = currentResult.rows[0];

    // Determine Daily Sequence Number if checking in now
    let dailySequenceNumber = current.daily_sequence_number;
    if (!dailySequenceNumber && (visitor.status === 'Checked-in' || (!current.check_in && visitor.checkIn))) {
      const dateToCheck = visitor.checkIn ? new Date(visitor.checkIn) : new Date();
      const seqResult = await query(`
        SELECT COUNT(*) as count 
        FROM visitors 
        WHERE daily_sequence_number IS NOT NULL 
        AND check_in:: date = CURRENT_DATE
  `);
      dailySequenceNumber = parseInt(seqResult.rows[0].count) + 1;
    }

    // Update with provided values or preserve existing ones
    await query(`
      UPDATE visitors SET
        name = $1,
        company = $2,
        host = $3,
        purpose = $4,
        check_in = $5,
        check_out = $6,
        status = $7,
        card_number = $8,
        visit_segments = $11,
        daily_sequence_number = $10,
        called_at = $12,
        staff_email = $13,
        staff_name = $14
      WHERE id = $9
    `, [
      visitor.name || current.name,
      visitor.company || current.company,
      visitor.host || current.host,
      visitor.purpose || current.purpose,
      visitor.checkIn || current.check_in,
      visitor.checkOut || current.check_out,
      visitor.status || current.status,
      visitor.cardNumber || current.card_number,
      req.params.id,
      dailySequenceNumber,
      JSON.stringify(visitor.visitSegments || current.visit_segments || []),
      visitor.calledAt || current.called_at,
      visitor.staffEmail !== undefined ? visitor.staffEmail : current.staff_email,
      visitor.staffName !== undefined ? visitor.staffName : current.staff_name
    ]);

    const result = await query('SELECT * FROM visitors WHERE id = $1', [req.params.id]);
    const v = result.rows[0];
    res.json({
      ...v,
      scheduledCheckIn: v.scheduled_check_in,
      checkIn: v.check_in,
      checkOut: v.check_out,
      cardNumber: v.card_number,
      calledAt: v.called_at,
      visitSegments: v.visit_segments || [],
      createdAt: v.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/quotation-templates', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM quotation_templates');
    res.json(result.rows.map(row => ({
      ...row,
      lineItems: row.line_items,
      createdAt: row.created_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quotation-templates', authenticateToken, async (req, res) => {
  try {
    const template = req.body;
    const result = await query(`
      INSERT INTO quotation_templates(title, description, line_items, total)
VALUES($1, $2, $3, $4)
      RETURNING id, title, description, line_items, total, created_at
  `, [
      template.title,
      template.description || null,
      JSON.stringify(template.lineItems || []),
      template.total || 0
    ]);
    const row = result.rows[0];
    res.json({
      ...row,
      lineItems: row.line_items,
      createdAt: row.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/quotation-templates/:id', authenticateToken, async (req, res) => {
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
    const result = await query('SELECT id, title, description, line_items, total, created_at FROM quotation_templates WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    res.json({
      ...row,
      lineItems: row.line_items,
      createdAt: row.created_at
    });
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
      INSERT INTO activity_log(admin_name, action)
VALUES($1, $2)
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
      INSERT INTO payment_activity_log(text, amount, type)
VALUES($1, $2, $3)
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
      INSERT INTO notifications(title, description, read, link_to, recipient_user_ids, recipient_roles)
VALUES($1, $2, $3, $4, $5, $6)
RETURNING *
  `, [
      notification.title,
      notification.description,
      notification.read ? 1 : 0,  // Convert boolean to integer
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
      WHERE recipient_user_ids:: jsonb @> $1:: jsonb 
      OR recipient_roles:: jsonb @> $2:: jsonb
  `, [JSON.stringify([req.user.id]), JSON.stringify([req.user.role])]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATTENDANCE ROUTES

// Helper: Haversine Distance (Meters)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// SETTINGS ROUTES
router.post('/settings/office-location', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2
    `, ['OFFICE_LOCATION', { lat, lng }]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings/office-location', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT value FROM system_settings WHERE key = $1', ['OFFICE_LOCATION']);
    res.json(result.rows[0]?.value || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Attendance routes
router.post('/attendance/check-in', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Check Geofence
    const settingsRes = await query('SELECT value FROM system_settings WHERE key = $1', ['OFFICE_LOCATION']);
    if (settingsRes.rows.length > 0) {
      const office = settingsRes.rows[0].value;
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Location required to mark attendance' });
      }
      const dist = getDistance(lat, lng, office.lat, office.lng);
      if (dist > 50) {
        return res.status(400).json({ error: `You are ${(dist - 50).toFixed(0)}m away from office. Must be within 50m.` });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    // Check if already checked in
    const existing = await query('SELECT * FROM attendance_logs WHERE user_id = $1 AND date = $2', [req.user.id, today]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    // Determine status (Late/On Time)
    // Fetch user shift start
    const user = await query('SELECT shift_start FROM users WHERE id = $1', [req.user.id]);
    const shiftStart = user.rows[0]?.shift_start; // "09:00"
    let status = 'Present';

    if (shiftStart) {
      const [h, m] = shiftStart.split(':').map(Number);
      const now = new Date();
      const shiftTime = new Date();
      shiftTime.setHours(h, m, 0, 0);
      // Allow 15 min buffer?
      shiftTime.setMinutes(shiftTime.getMinutes() + 15);
      if (now > shiftTime) status = 'Late';
    }

    await query(`
      INSERT INTO attendance_logs (user_id, date, check_in, status)
      VALUES ($1, $2, NOW(), $3)
    `, [req.user.id, today, status]);

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out
router.post('/attendance/check-out', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Check Geofence (Optional for Check-out? User said "mark attendence", implies both. Let's strict.)
    const settingsRes = await query('SELECT value FROM system_settings WHERE key = $1', ['OFFICE_LOCATION']);
    if (settingsRes.rows.length > 0) {
      const office = settingsRes.rows[0].value;
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Location required to mark attendance' });
      }
      const dist = getDistance(lat, lng, office.lat, office.lng);
      if (dist > 50) {
        return res.status(400).json({ error: `You are ${(dist - 50).toFixed(0)}m away. Must be within 50m.` });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const result = await query(`
      UPDATE attendance_logs 
      SET check_out = NOW()
      WHERE user_id = $1 AND date = $2 AND check_out IS NULL
      RETURNING *
    `, [req.user.id, today]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No active check-in found for today' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Attendance History (Staff)
router.get('/attendance/me', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM attendance_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 30', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HOLIDAY ROUTES
router.get('/holidays', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM holidays ORDER BY date ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/holidays', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { date, description } = req.body;
    const result = await query('INSERT INTO holidays (date, description) VALUES ($1, $2) RETURNING *', [date, description]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/holidays/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    await query('DELETE FROM holidays WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LEAVE MANAGEMENT
router.post('/leaves', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Dates required' });

    const result = await query(`
      INSERT INTO leave_requests (user_id, start_date, end_date, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, startDate, endDate, reason]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaves', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT l.*, u.name as user_name, u.email as user_email
      FROM leave_requests l
      JOIN users u ON l.user_id = u.id
    `;
    const params = [];

    // RBAC: Staff only see their own, Admin sees all
    if (req.user.role !== 'Admin') {
      sql += ` WHERE l.user_id = $1`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY l.created_at DESC`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/leaves/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await query(`
      UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *
    `, [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PAYROLL REPORT (Admin)
router.get('/attendance/payroll', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { month, year } = req.query; // e.g. month=1 (Jan), year=2024

    if (!month || !year) return res.status(400).json({ error: 'Month and Year required' });

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    // Calculate end date (last day of month)
    const endDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${endDay}`;

    // Fetch all users with salary info
    const users = await query('SELECT id, name, base_salary, joining_date FROM users WHERE role != $1', ['Student']);

    // Fetch holidays in this month
    const holidaysRes = await query('SELECT * FROM holidays WHERE date >= $1 AND date <= $2', [startDate, endDate]);
    const holidaysCount = holidaysRes.rows.length;

    // Fetch attendance logs for this month
    const logsRes = await query('SELECT * FROM attendance_logs WHERE date >= $1 AND date <= $2', [startDate, endDate]);
    const logs = logsRes.rows;

    // Fetch APPROVED leaves overlapping this month
    const leavesRes = await query(`
        SELECT * FROM leave_requests 
        WHERE status = 'Approved' 
        AND start_date <= $2 AND end_date >= $1
    `, [startDate, endDate]);
    const leaves = leavesRes.rows;

    const report = users.rows.map(user => {
      const userLogs = logs.filter(l => l.user_id === user.id);
      const presentDays = userLogs.length; // Simple count of check-ins
      const lateDays = userLogs.filter(l => l.status === 'Late').length;

      // Calculate Working Days
      // Total days in month - Sundays - Holidays
      // Calculate Standard Working Days (Full Month) for Rate Calculation
      let standardSundays = 0;
      for (let d = 1; d <= endDay; d++) {
        const date = new Date(Number(year), Number(month) - 1, d);
        if (date.getDay() === 0) standardSundays++;
      }
      const standardWorkingDays = endDay - standardSundays - holidaysCount;
      const baseSalary = parseFloat(user.base_salary) || 0;
      const payPerDay = standardWorkingDays > 0 ? baseSalary / standardWorkingDays : 0;

      // Calculate Effective Working Days for User (Considering Join Date)
      const joinDate = user.joining_date ? new Date(user.joining_date) : null;
      let effectiveStartDay = 1;

      // If user joined this month, start from join date
      if (joinDate && joinDate.getFullYear() === Number(year) && joinDate.getMonth() === Number(month) - 1) {
        effectiveStartDay = joinDate.getDate();
      }
      // If user joined AFTER this month, they have 0 working days
      if (joinDate && (joinDate.getFullYear() > Number(year) || (joinDate.getFullYear() === Number(year) && joinDate.getMonth() > Number(month) - 1))) {
        // Future joiner
        return { userId: user.id, name: user.name, baseSalary, workingDays: 0, presentDays: 0, lateDays: 0, finalSalary: 0 };
      }

      let userSundays = 0;
      for (let d = effectiveStartDay; d <= endDay; d++) {
        const date = new Date(Number(year), Number(month) - 1, d);
        if (date.getDay() === 0) userSundays++;
      }

      // Holidays falling in user's tenure
      const validHolidays = holidaysRes.rows.filter(h => {
        const hDate = new Date(h.date);
        return hDate.getDate() >= effectiveStartDay;
      }).length;

      const userLength = endDay - effectiveStartDay + 1;
      const workingDays = Math.max(0, userLength - userSundays - validHolidays);

      // Calculate Paid Leave Days
      const userLeaves = leaves.filter(l => l.user_id === user.id);
      let paidLeaveDays = 0;
      userLeaves.forEach(leave => {
        const lStart = new Date(leave.start_date);
        const lEnd = new Date(leave.end_date);

        // Iterate days in leave
        for (let d = new Date(lStart); d <= lEnd; d.setDate(d.getDate() + 1)) { // Create new Date object for iteration
          // Check if date falls in current month and user tenure
          if (d.getMonth() === Number(month) - 1 && d.getFullYear() === Number(year) && d.getDate() >= effectiveStartDay && d.getDate() <= endDay) {
            // Exclude Sundays (assuming leaves don't count on Sundays)
            if (d.getDay() !== 0) {
              // Exclude Holidays? Usually yes.
              const isHoliday = holidaysRes.rows.some(h => new Date(h.date).toDateString() === d.toDateString());
              if (!isHoliday) {
                paidLeaveDays++;
              }
            }
          }
        }
      });

      // Deductions
      // Absent days = workingDays - presentDays - paidLeaveDays
      // Logic: You should be present (workingDays). You were present X days. You were on paid leave Y days.
      // Deficit = workingDays - (present + leave).
      const absentDays = Math.max(0, workingDays - presentDays - paidLeaveDays);
      const absentDeduction = absentDays * payPerDay;

      // Late deduction: 50 INR per late arrival
      const lateDeduction = lateDays * 50;

      const finalSalary = Math.round(Math.max(0, ((presentDays + paidLeaveDays) * payPerDay) - lateDeduction));

      return {
        userId: user.id,
        name: user.name,
        baseSalary,
        workingDays,
        presentDays,
        paidLeaveDays, // Useful for frontend
        lateDays,
        finalSalary
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VISITOR DELETE ROUTE
router.delete('/visitors/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('DELETE FROM visitors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json({ success: true, deletedVisitor: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
