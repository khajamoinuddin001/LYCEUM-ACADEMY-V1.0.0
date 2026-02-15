import express from 'express';
import { query, getClient } from '../database.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// Public Visitor Tracking Endpoint
router.post('/public/track-visit', async (req, res) => {
  try {
    const { visitorId, path, referrer, userAgent, userId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: 'Visitor ID is required' });
    }

    // Check if this is a new visitor
    const checkRes = await query(
      'SELECT id FROM website_visits WHERE visitor_id = $1 LIMIT 1',
      [visitorId]
    );
    const isNewVisitor = checkRes.rows.length === 0;

    await query(
      `INSERT INTO website_visits (visitor_id, path, referrer, user_agent, user_id, is_new_visitor)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [visitorId, path || '/', referrer, userAgent, userId || null, isNewVisitor]
    );

    res.json({ success: true, isNewVisitor });
  } catch (error) {
    console.error('Track visit error:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
});

// Helper to parse User Agent strings
const parseUA = (ua) => {
  if (!ua) return { browser: 'Unknown', platform: 'Unknown' };

  let browser = 'Other';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let platform = 'Other';
  if (ua.includes('Windows')) platform = 'Windows';
  else if (ua.includes('Macintosh')) platform = 'Mac';
  else if (ua.includes('Linux')) platform = 'Linux';
  else if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';

  return { browser, platform };
};

// Marketing Visitor Stats Endpoint
router.get('/marketing/visitor-stats', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 7;
    const currentInterval = `${range} days`;
    const prevIntervalStart = `${range * 2} days`;
    const prevIntervalEnd = `${range} days`;

    // Current Range Stats
    const totalVisits = await query(`SELECT COUNT(*)::int as count FROM website_visits WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'`);
    const uniqueVisitors = await query(`SELECT COUNT(DISTINCT visitor_id)::int as count FROM website_visits WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'`);
    const newVisitors = await query(`SELECT COUNT(DISTINCT visitor_id)::int as count FROM website_visits WHERE is_new_visitor = true AND timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'`);
    const totalLeads = await query(`SELECT COUNT(*)::int as count FROM leads WHERE created_at > CURRENT_DATE - INTERVAL '${currentInterval}'`);

    // Previous Range Stats (for growth calculation)
    const prevVisits = await query(`SELECT COUNT(*)::int as count FROM website_visits WHERE timestamp BETWEEN CURRENT_DATE - INTERVAL '${prevIntervalStart}' AND CURRENT_DATE - INTERVAL '${prevIntervalEnd}'`);
    const prevUnique = await query(`SELECT COUNT(DISTINCT visitor_id)::int as count FROM website_visits WHERE timestamp BETWEEN CURRENT_DATE - INTERVAL '${prevIntervalStart}' AND CURRENT_DATE - INTERVAL '${prevIntervalEnd}'`);
    const prevLeads = await query(`SELECT COUNT(*)::int as count FROM leads WHERE created_at BETWEEN CURRENT_DATE - INTERVAL '${prevIntervalStart}' AND CURRENT_DATE - INTERVAL '${prevIntervalEnd}'`);

    const calculateGrowth = (current, prev) => {
      if (!prev || prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    // Top Pages
    const topPages = await query(`
      SELECT path, COUNT(*)::int as count 
      FROM website_visits 
      WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'
      GROUP BY path 
      ORDER BY count DESC 
      LIMIT 10
    `);

    // Top Referrers
    const topReferrers = await query(`
      SELECT COALESCE(referrer, 'Direct') as referrer, COUNT(*)::int as count 
      FROM website_visits 
      WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 10
    `);

    // Categorized Referrers
    const categorizeReferrer = (ref) => {
      if (!ref || ref === 'Direct') return 'Direct';
      const url = ref.toLowerCase();
      if (url.includes('google') || url.includes('bing') || url.includes('yahoo')) return 'Search';
      if (url.includes('facebook') || url.includes('instagram') || url.includes('twitter') || url.includes('linkedin') || url.includes('t.co')) return 'Social';
      return 'Other';
    };

    const referrerCategories = { Direct: 0, Social: 0, Search: 0, Other: 0 };
    const socialBreakdown = { Instagram: 0, Facebook: 0, YouTube: 0, Twitter: 0, LinkedIn: 0, Other: 0 };

    topReferrers.rows.forEach(r => {
      const cat = categorizeReferrer(r.referrer);
      referrerCategories[cat] += r.count;

      if (cat === 'Social') {
        const ref = r.referrer.toLowerCase();
        if (ref.includes('instagram')) socialBreakdown.Instagram += r.count;
        else if (ref.includes('facebook') || ref.includes('fb.com')) socialBreakdown.Facebook += r.count;
        else if (ref.includes('youtube') || ref.includes('youtu.be')) socialBreakdown.YouTube += r.count;
        else if (ref.includes('twitter') || ref.includes('t.co')) socialBreakdown.Twitter += r.count;
        else if (ref.includes('linkedin')) socialBreakdown.LinkedIn += r.count;
        else socialBreakdown.Other += r.count;
      }
    });

    // Trends
    const trends = await query(`
      SELECT 
        DATE(timestamp) as date, 
        COUNT(*)::int as visits,
        COUNT(DISTINCT visitor_id)::int as unique_visitors
      FROM website_visits
      WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) ASC
    `);

    // Peak Hours
    const peakHoursRes = await query(`
      SELECT 
        EXTRACT(HOUR FROM timestamp)::int as hour, 
        COUNT(*)::int as count
      FROM website_visits
      WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'
      GROUP BY hour
      ORDER BY hour ASC
    `);

    // Average Session Depth
    const sessionDepthRes = await query(`
      WITH visitor_depths AS (
        SELECT visitor_id, COUNT(DISTINCT path) as depth
        FROM website_visits
        WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}'
        GROUP BY visitor_id
      )
      SELECT AVG(depth)::float as avg_depth FROM visitor_depths
    `);

    // Recent visits
    const recentRes = await query(`
      SELECT * FROM website_visits 
      ORDER BY timestamp DESC 
      LIMIT 100
    `);

    // Browser & Platform Aggregations
    const uaRes = await query(`SELECT user_agent FROM website_visits WHERE timestamp > CURRENT_DATE - INTERVAL '${currentInterval}' ORDER BY timestamp DESC LIMIT 2000`);
    const browsers = {};
    const platforms = {};

    uaRes.rows.forEach(row => {
      const { browser, platform } = parseUA(row.user_agent);
      browsers[browser] = (browsers[browser] || 0) + 1;
      platforms[platform] = (platforms[platform] || 0) + 1;
    });

    res.json({
      summary: {
        totalVisits: totalVisits.rows[0].count,
        uniqueVisitors: uniqueVisitors.rows[0].count,
        newVisitors: newVisitors.rows[0].count,
        returningVisitors: uniqueVisitors.rows[0].count - newVisitors.rows[0].count,
        totalLeads: totalLeads.rows[0].count,
        avgDepth: Math.round((parseFloat(sessionDepthRes.rows[0].avg_depth) || 0) * 10) / 10,
        growth: {
          visits: calculateGrowth(totalVisits.rows[0].count, prevVisits.rows[0].count),
          unique: calculateGrowth(uniqueVisitors.rows[0].count, prevUnique.rows[0].count),
          leads: calculateGrowth(totalLeads.rows[0].count, prevLeads.rows[0].count)
        }
      },
      trends: trends.rows,
      topPages: topPages.rows,
      topReferrers: topReferrers.rows,
      referrerCategories,
      socialBreakdown,
      peakHours: peakHoursRes.rows,
      browsers,
      platforms,
      recent: recentRes.rows.slice(0, 20).map(v => ({
        ...v,
        ...parseUA(v.user_agent)
      }))
    });
  } catch (error) {
    console.error('Visitor stats error:', error);
    res.status(500).json({ error: 'Failed to fetch visitor stats' });
  }
});

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
import fs from 'fs';

// Document routes
router.post('/documents', authenticateToken, async (req, res) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });

      const contactId = parseInt(req.body.contactId);
      const isPrivate = req.body.isPrivate === 'true';
      const category = req.body.category || null;
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
        INSERT INTO documents (contact_id, name, type, size, content, is_private, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, contact_id, name, type, size, uploaded_at, is_private, category
      `, [contactId, file.originalname, file.mimetype, file.size, file.buffer, isPrivate, category]);

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

    let queryText = 'SELECT id, contact_id, name, type, size, uploaded_at, is_private, category FROM documents WHERE contact_id = $1';

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
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const isAdminOrStaff = req.user.role === 'Admin' || req.user.role === 'Staff';

    let result;
    if (isAdminOrStaff) {
      result = await query('SELECT id, name, email, phone, role, permissions, must_reset_password, created_at, shift_start, shift_end, working_days, joining_date, base_salary FROM users');
    } else {
      // Students should only see what is necessary for chat/identifying users
      result = await query('SELECT id, name, email, role FROM users');
    }

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
    counselorAssigned2: dbContact.counselor_assigned_2,
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
              workingDays: cUser.working_days
            };
            try {
              if (typeof cUser.working_days === 'string') {
                transformed.counselorDetails.workingDays = JSON.parse(cUser.working_days);
              }
            } catch (e) { }
          }
        }

        // Fetch details for second counselor
        if (transformed.counselorAssigned2) {
          const counselorRes2 = await query('SELECT email, phone, shift_start, shift_end, working_days FROM users WHERE name = $1', [transformed.counselorAssigned2]);
          if (counselorRes2.rows.length > 0) {
            const cUser2 = counselorRes2.rows[0];
            transformed.counselorDetails2 = {
              email: cUser2.email,
              phone: cUser2.phone,
              shiftStart: cUser2.shift_start,
              shiftEnd: cUser2.shift_end,
              workingDays: cUser2.working_days
            };
            try {
              if (typeof cUser2.working_days === 'string') {
                transformed.counselorDetails2.workingDays = JSON.parse(cUser2.working_days);
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
    stream, intake, counselor_assigned, counselor_assigned_2, application_email, application_password, avatar_url, metadata
  ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41)
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
      contact.counselorAssigned2 || null,
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

    // --- Clean up dependent records to satisfy foreign key constraints ---

    // 1. Visitors: Set contact_id to NULL so we don't lose visitor history
    await query('UPDATE visitors SET contact_id = NULL WHERE contact_id = $1', [contactId]);

    // 2. Tickets: Delete associated tickets (or set to NULL if preferred, but usually tickets are contact-specific)
    await query('DELETE FROM tickets WHERE contact_id = $1', [contactId]);

    // 3. Transactions: Set contact_id to NULL to preserve financial records for the business
    await query('UPDATE transactions SET contact_id = NULL WHERE contact_id = $1', [contactId]);

    // 4. Tasks: Set contact_id to NULL
    await query('UPDATE tasks SET contact_id = NULL WHERE contact_id = $1', [contactId]);

    // 5. Recurring Tasks: Delete if they were specific to this contact
    await query('DELETE FROM recurring_tasks WHERE contact_id = $1', [contactId]);

    // Finally, delete the contact
    await query('DELETE FROM contacts WHERE id = $1', [contactId]);

    // If contact has a linked user, delete the user account as well
    if (contact.user_id) {
      await query('DELETE FROM users WHERE id = $1', [contact.user_id]);
      console.log(`Associated user account (ID: ${contact.user_id}) deleted for contact ${contactId}`);
    }

    res.json({ success: true, message: 'Contact and associated records processed successfully' });
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
      stream = $32, intake = $33, counselor_assigned = $34, counselor_assigned_2 = $35, application_email = $36,
      application_password = $37, metadata = $38
      WHERE id = $39
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
      contact.counselorAssigned2,
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
      counselor_assigned_2: primary.counselor_assigned_2 || target.counselor_assigned_2,
      application_email: primary.application_email || target.application_email,
      application_password: primary.application_password || target.application_password,
      avatar_url: primary.avatar_url || target.avatar_url,
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
        stream = $32, intake = $33, counselor_assigned = $34, counselor_assigned_2 = $35, application_email = $36,
        application_password = $37, avatar_url = $38, user_id = $39
      WHERE id = $40
    `, [
      mergedData.name, mergedData.email, mergedData.phone, mergedData.department, mergedData.major, mergedData.notes,
      mergedData.file_status, mergedData.agent_assigned, JSON.stringify(mergedData.checklist), JSON.stringify(mergedData.activity_log),
      JSON.stringify(mergedData.recorded_sessions), JSON.stringify(mergedData.documents), JSON.stringify(mergedData.visa_information),
      JSON.stringify(mergedData.lms_progress), JSON.stringify(mergedData.lms_notes), mergedData.gpa, mergedData.advisor,
      JSON.stringify(mergedData.courses), mergedData.street1, mergedData.street2, mergedData.city, mergedData.state,
      mergedData.zip, mergedData.country, mergedData.gstin, mergedData.pan, mergedData.tags, mergedData.visa_type,
      mergedData.country_of_application, mergedData.source, mergedData.contact_type, mergedData.stream, mergedData.intake,
      mergedData.counselor_assigned, mergedData.counselor_assigned_2, mergedData.application_email, mergedData.application_password,
      mergedData.avatar_url, mergedData.user_id, primaryId
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

    // Update tasks (Fix for foreign key constraint)
    const tasksResult = await query('UPDATE tasks SET contact_id = $1 WHERE contact_id = $2 RETURNING id', [primaryId, targetContactId]);
    recordsUpdated.tasks = tasksResult.rows.length;

    // Update recurring tasks (Fix for foreign key constraint)
    const recurringTasksResult = await query('UPDATE recurring_tasks SET contact_id = $1 WHERE contact_id = $2 RETURNING task_id', [primaryId, targetContactId]);
    recordsUpdated.recurringTasks = recurringTasksResult.rows.length;

    // Update tickets (Fix for missing data)
    const ticketsResult = await query('UPDATE tickets SET contact_id = $1 WHERE contact_id = $2 RETURNING ticket_id', [primaryId, targetContactId]);
    recordsUpdated.tickets = ticketsResult.rows.length;

    // If target had a user link, update user to point to primary contact
    if (target.user_id && !primary.user_id) {
      await query('UPDATE users SET name = $1 WHERE id = $2', [mergedData.name, target.user_id]);
      console.log(`✅ Updated user ${target.user_id} to link with primary contact`);
    }

    // Delete target contact
    await query('DELETE FROM contacts WHERE id = $1', [targetContactId]);

    console.log(`✅ Merge complete: ${recordsUpdated.visitors} visitors, ${recordsUpdated.transactions} transactions, ${recordsUpdated.leads} leads, ${recordsUpdated.tasks} tasks, ${recordsUpdated.recurringTasks} recurring tasks, ${recordsUpdated.tickets} tickets updated`);

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

// Sync recurring task for a lead
const syncRecurringTaskForLead = async (leadId) => {
  try {
    const leadRes = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rows.length === 0) return;
    const lead = leadRes.rows[0];

    const activeStages = ['New', 'Qualified', 'Proposal'];
    const shouldBeActive = activeStages.includes(lead.stage);

    const existingRes = await query('SELECT id, is_active FROM recurring_tasks WHERE lead_id = $1', [leadId]);

    if (shouldBeActive) {
      if (existingRes.rows.length === 0) {
        // Create new
        const taskId = await getNextTaskId('REQ');

        // Fetch global assignee email if set
        const settingsRes = await query('SELECT value FROM system_settings WHERE key = $1', ['RECURRING_TASK_ASSIGNEE']);
        const globalAssigneeId = settingsRes.rows[0]?.value?.userId;
        let emails = [];
        if (globalAssigneeId) {
          const userRes = await query('SELECT email FROM users WHERE id = $1', [globalAssigneeId]);
          if (userRes.rows.length > 0) {
            emails.push(userRes.rows[0].email);
          }
        }

        await query(`
          INSERT INTO recurring_tasks(task_id, lead_id, title, description, frequency_days, next_generation_at, visibility_emails)
          VALUES($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
        `, [
          taskId,
          leadId,
          `Follow up with ${lead.contact} (${lead.company})`,
          `Automated follow up for ${lead.stage} lead. Phone: ${lead.phone || 'N/A'}. Email: ${lead.email || 'N/A'}`,
          2,
          JSON.stringify(emails)
        ]);
      } else if (!existingRes.rows[0].is_active) {
        // Reactivate
        await query('UPDATE recurring_tasks SET is_active = true WHERE id = $1', [existingRes.rows[0].id]);
      }
    } else {
      // Should be inactive
      if (existingRes.rows.length > 0 && existingRes.rows[0].is_active) {
        await query('UPDATE recurring_tasks SET is_active = false WHERE id = $1', [existingRes.rows[0].id]);
      }
    }
  } catch (err) {
    console.error('Error syncing recurring task:', err);
  }
};

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

// Visa Operations Routes
router.get('/visa-operations/items/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT item.*, op.user_id as op_creator_id, c.user_id as student_user_id
      FROM visa_operation_items item
      JOIN visa_operations op ON item.operation_id = op.id
      JOIN contacts c ON op.contact_id = c.id
      WHERE item.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = result.rows[0];

    // Access control: Admin, Creator (Staff), or the Student the operation belongs to
    const isStudentOwner = req.user.role === 'Student' && String(req.user.id) === String(item.student_user_id);
    const isCreator = String(req.user.id) === String(item.op_creator_id);
    const isAdmin = req.user.role === 'Admin';
    const isStaff = req.user.role === 'Staff';

    if (!isAdmin && !isStudentOwner && !isCreator && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized access to visa operation items' });
    }

    if (item.item_type === 'document') {
      const isPreview = req.query.preview === 'true';
      res.setHeader('Content-Type', item.content_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `${isPreview ? 'inline' : 'attachment'}; filename="${item.name || 'document'}"`);
      return res.send(item.file_data);
    } else {
      return res.json({ text: item.text_content });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/visa-operations', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT vo.*, 
             c.name as c_name, 
             c.phone as c_phone, 
             c.country as c_country,
             c.country_of_application as c_app_country
      FROM visa_operations vo
      LEFT JOIN contacts c ON vo.contact_id = c.id
    `;
    let params = [];

    if (req.user.role === 'Student') {
      sql += ' WHERE c.user_id = $1';
      params.push(req.user.id);
    }

    sql += ' ORDER BY vo.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows.map(row => {
      const isStudent = req.user.role === 'Student';
      const showCgi = row.show_cgi_on_portal || !isStudent;

      let cgiData = row.cgi_data;
      if (isStudent && !showCgi && cgiData) {
        // Mask sensitive data for students if not permitted
        cgiData = {
          ...cgiData,
          username: '••••••••',
          password: '••••••••',
          securityAnswer1: '••••••••',
          securityAnswer2: '••••••••',
          securityAnswer3: '••••••••'
        };
      }

      return {
        ...row,
        name: row.c_name || row.name,
        phone: row.c_phone || row.phone,
        country: row.c_app_country || row.c_country || row.country,
        cgiData,
        slotBookingData: row.slot_booking_data,
        visaInterviewData: row.visa_interview_data,
        dsData: row.ds_data,
        showCgiOnPortal: row.show_cgi_on_portal,
        vopNumber: row.vop_number,
        contactId: row.contact_id,
        userId: row.user_id,
        createdAt: row.created_at
      };
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visa-operations/:id/cgi', authenticateToken, async (req, res) => {
  try {
    const { cgiData, showCgiOnPortal } = req.body;
    const result = await query(`
      UPDATE visa_operations
      SET cgi_data = $1, show_cgi_on_portal = $2
      WHERE id = $3
      RETURNING *
    `, [JSON.stringify(cgiData), showCgiOnPortal, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const opRows = result.rows[0];
    const cgiOutput = {
      ...opRows,
      cgiData: opRows.cgi_data,
      slotBookingData: opRows.slot_booking_data,
      visaInterviewData: opRows.visa_interview_data,
      dsData: opRows.ds_data,
      showCgiOnPortal: opRows.show_cgi_on_portal,
      vopNumber: opRows.vop_number,
      contactId: opRows.contact_id,
      userId: opRows.user_id,
      createdAt: opRows.created_at
    };
    res.json(cgiOutput);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visa-operations/:id/slot-booking', authenticateToken, async (req, res) => {
  try {
    const { slotBookingData, visaInterviewData, status } = req.body;
    const isStudent = req.user.role === 'Student';

    // Get current data first to avoid overwriting staff-entered data and check lock status
    const currentOp = await query('SELECT slot_booking_data FROM visa_operations WHERE id = $1', [req.params.id]);
    if (currentOp.rows.length === 0) return res.status(404).json({ error: 'Operation not found' });
    const currentSlotData = currentOp.rows[0].slot_booking_data || {};

    // If student, check if preferences are locked and filter updates
    let finalSlotBookingData = slotBookingData;
    if (isStudent && slotBookingData) {
      if (currentSlotData.preferencesLocked) {
        return res.status(403).json({ error: 'Preferences are locked and cannot be changed.' });
      }

      finalSlotBookingData = {
        ...currentSlotData,
        vacPreferred: slotBookingData.vacPreferred,
        viPreferred: slotBookingData.viPreferred,
        preferencesLocked: slotBookingData.preferencesLocked || false
      };
    }

    const updates = [];
    const values = [];
    let pCount = 1;

    if (finalSlotBookingData !== undefined) {
      updates.push(`slot_booking_data = $${pCount++}`);
      values.push(JSON.stringify(finalSlotBookingData));
    }

    // Students cannot update interview outcome or status
    if (!isStudent) {
      if (visaInterviewData !== undefined) {
        updates.push(`visa_interview_data = $${pCount++}`);
        values.push(JSON.stringify(visaInterviewData));
      }
      if (status !== undefined) {
        updates.push(`status = $${pCount++}`);
        values.push(status);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    values.push(req.params.id);
    const result = await query(`
      UPDATE visa_operations
      SET ${updates.join(', ')}
      WHERE id = $${pCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const opData = result.rows[0];
    const slotResponse = {
      ...opData,
      cgiData: opData.cgi_data,
      slotBookingData: opData.slot_booking_data,
      visaInterviewData: opData.visa_interview_data,
      dsData: opData.ds_data,
      showCgiOnPortal: opData.show_cgi_on_portal,
      vopNumber: opData.vop_number,
      contactId: opData.contact_id,
      userId: opData.user_id,
      createdAt: opData.created_at
    };
    res.json(slotResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visa-operations/:id/ds-160', authenticateToken, async (req, res) => {
  try {
    const { dsData } = req.body;
    const result = await query(`
      UPDATE visa_operations
      SET ds_data = $1
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(dsData), req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const op = result.rows[0];
    res.json({
      ...op,
      cgiData: op.cgi_data,
      slotBookingData: op.slot_booking_data,
      visaInterviewData: op.visa_interview_data,
      dsData: op.ds_data,
      showCgiOnPortal: op.show_cgi_on_portal,
      vopNumber: op.vop_number,
      contactId: op.contact_id,
      userId: op.user_id,
      createdAt: op.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visa-operations/:id/ds-160/document', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const opResult = await query('SELECT contact_id, ds_data FROM visa_operations WHERE id = $1', [req.params.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const { ds_data } = opResult.rows[0];
    const uploadType = req.query.type || 'internal'; // 'internal' or 'filling'

    // Create entry in visa_operation_items
    const itemResult = await query(`
      INSERT INTO visa_operation_items (operation_id, item_type, name, content_type, file_data)
      VALUES ($1, 'document', $2, $3, $4)
      RETURNING id
    `, [req.params.id, req.file.originalname, req.file.mimetype, req.file.buffer]);

    const itemId = itemResult.rows[0].id;

    // Update ds_data in visa_operations based on type
    const updatedDsData = { ...ds_data };

    if (uploadType === 'filling') {
      // Initialize fillingDocuments if it doesn't exist
      if (!updatedDsData.fillingDocuments) {
        updatedDsData.fillingDocuments = [];
        // Optional: migrate old single value if it exists
        if (updatedDsData.fillingDocumentId) {
          updatedDsData.fillingDocuments.push({
            id: updatedDsData.fillingDocumentId,
            name: updatedDsData.fillingDocumentName
          });
          delete updatedDsData.fillingDocumentId;
          delete updatedDsData.fillingDocumentName;
        }
      }

      updatedDsData.fillingDocuments.push({
        id: itemId,
        name: req.file.originalname
      });

      updatedDsData.studentStatus = 'pending';
      updatedDsData.adminStatus = 'pending';
    } else {
      updatedDsData.documentId = itemId;
      updatedDsData.documentName = req.file.originalname;
    }

    const result = await query(`
      UPDATE visa_operations
      SET ds_data = $1
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(updatedDsData), req.params.id]);

    const op = result.rows[0];
    res.json({
      ...op,
      cgiData: op.cgi_data,
      slotBookingData: op.slot_booking_data,
      visaInterviewData: op.visa_interview_data,
      dsData: op.ds_data,
      showCgiOnPortal: op.show_cgi_on_portal,
      vopNumber: op.vop_number,
      contactId: op.contact_id,
      userId: op.user_id,
      createdAt: op.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/visa-operations/:id/ds-160/document/:itemId', authenticateToken, async (req, res) => {
  try {
    const opResult = await query('SELECT ds_data FROM visa_operations WHERE id = $1', [req.params.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const { ds_data } = opResult.rows[0];
    const itemId = parseInt(req.params.itemId);
    const updatedDsData = { ...ds_data };

    // Handle single document (internal)
    if (updatedDsData.documentId === itemId) {
      delete updatedDsData.documentId;
      delete updatedDsData.documentName;
    }

    // Handle fillingDocuments array
    if (updatedDsData.fillingDocuments) {
      updatedDsData.fillingDocuments = updatedDsData.fillingDocuments.filter(doc => doc.id !== itemId);
    }

    // Also check the old single filling document fields for backward compatibility
    if (updatedDsData.fillingDocumentId === itemId) {
      delete updatedDsData.fillingDocumentId;
      delete updatedDsData.fillingDocumentName;
    }

    const result = await query(`
      UPDATE visa_operations
      SET ds_data = $1
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(updatedDsData), req.params.id]);

    const op = result.rows[0];
    res.json({
      ...op,
      cgiData: op.cgi_data,
      slotBookingData: op.slot_booking_data,
      visaInterviewData: op.visa_interview_data,
      dsData: op.ds_data,
      showCgiOnPortal: op.show_cgi_on_portal,
      vopNumber: op.vop_number,
      contactId: op.contact_id,
      userId: op.user_id,
      createdAt: op.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visa-operations/:id/ds-160/status', authenticateToken, async (req, res) => {
  try {
    const { studentStatus, adminStatus, rejectionReason } = req.body;
    const opResult = await query('SELECT ds_data FROM visa_operations WHERE id = $1', [req.params.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const currentDsData = opResult.rows[0].ds_data || {};
    const updatedDsData = {
      ...currentDsData,
      ...(studentStatus && { studentStatus }),
      ...(adminStatus && { adminStatus }),
      ...(rejectionReason && { rejectionReason }),
      ...(adminStatus === 'accepted' && { adminName: req.user.name })
    };

    const result = await query(`
      UPDATE visa_operations
      SET ds_data = $1
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(updatedDsData), req.params.id]);

    const op = result.rows[0];

    // Notification Logic: If student approves, notify Admin
    if (studentStatus === 'accepted') {
      try {
        const contactResult = await query('SELECT name FROM contacts WHERE id = $1', [op.contact_id]);
        const clientName = contactResult.rows.length > 0 ? contactResult.rows[0].name : 'Unknown Client';

        await query(`
          INSERT INTO notifications(title, description, read, link_to, recipient_roles)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          'DS-160 Approved by Student',
          `A client ${clientName} has approved the DS-160, waiting for admin to approve.`,
          0,
          JSON.stringify({ type: 'visa_operation', id: req.params.id }),
          JSON.stringify(['Admin'])
        ]);
      } catch (notifyError) {
        console.error('Failed to create notification:', notifyError);
        // Don't fail the primary request if notification fails
      }
    }

    res.json({
      ...op,
      cgiData: op.cgi_data,
      slotBookingData: op.slot_booking_data,
      visaInterviewData: op.visa_interview_data,
      dsData: op.ds_data,
      showCgiOnPortal: op.show_cgi_on_portal,
      vopNumber: op.vop_number,
      contactId: op.contact_id,
      userId: op.user_id,
      createdAt: op.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visa-operations', authenticateToken, async (req, res) => {
  try {
    const { contactId, name, phone, country } = req.body;

    // Generate VOP-XXXXX number
    const lastOpResult = await query(
      "SELECT vop_number FROM visa_operations WHERE vop_number LIKE 'VOP-%' ORDER BY id DESC LIMIT 1"
    );

    let nextNumber = 1;
    if (lastOpResult.rows.length > 0) {
      const lastVop = lastOpResult.rows[0].vop_number;
      const lastNum = parseInt(lastVop.split('-')[1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const vopNumber = `VOP-${String(nextNumber).padStart(5, '0')}`;

    const result = await query(`
      INSERT INTO visa_operations (vop_number, contact_id, name, phone, country, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [vopNumber, contactId, name, phone, country, req.user.id]);

    const newOp = result.rows[0];
    res.json({
      ...newOp,
      vopNumber: newOp.vop_number,
      contactId: newOp.contact_id,
      userId: newOp.user_id,
      createdAt: newOp.created_at
    });
  } catch (error) {
    console.error('Error creating visa operation:', error);
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

    // 1. Strict Check or Create Contact (Merge only if Name AND Phone match)
    let contactName = lead.contact;
    const existingContact = await query(
      'SELECT id, name, phone, activity_log FROM contacts WHERE LOWER(name) = LOWER($1) AND phone = $2 LIMIT 1',
      [lead.contact, lead.phone]
    );

    if (existingContact.rows.length === 0) {
      // Create NEW contact if no safe match found
      console.log(`📝 Auto-creating contact for manual lead: ${lead.contact}`);

      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const datePrefix = `LA${yy}${mm}${dd} `;

      const todayContacts = await query(
        "SELECT contact_id FROM contacts WHERE contact_id LIKE $1 ORDER BY contact_id DESC LIMIT 1",
        [`${datePrefix}%`]
      );

      let sequence = 0;
      if (todayContacts.rows.length > 0) {
        const lastId = todayContacts.rows[0].contact_id;
        const lastSeq = parseInt(lastId.trim().slice(-3));
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
      }

      const generatedContactId = `${datePrefix}${String(sequence).padStart(3, '0')}`;

      await query(`
        INSERT INTO contacts (name, email, phone, contact_id, source, department, notes, checklist, activity_log, recorded_sessions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        lead.contact,
        lead.email,
        lead.phone,
        generatedContactId,
        lead.source || 'Manual Entry',
        'Unassigned',
        lead.notes || 'Manually created lead.',
        JSON.stringify(DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item, id: Date.now() + Math.random() }))),
        JSON.stringify([{ date: new Date().toISOString(), action: 'Lead Created', details: 'Contact created automatically during manual lead entry.' }]),
        '[]'
      ]);
    } else {
      // Safe Merge: Update history and fill in missing phone if applicable
      const matched = existingContact.rows[0];
      contactName = matched.name; // Use the canonical name from the contact record

      // Update phone if the existing record was missing it
      if (!matched.phone && lead.phone) {
        await query('UPDATE contacts SET phone = $1 WHERE id = $2', [lead.phone, matched.id]);
      }

      const currentLog = Array.isArray(matched.activity_log) ? matched.activity_log : (typeof matched.activity_log === 'string' ? JSON.parse(matched.activity_log) : []);
      const updatedLog = [
        ...currentLog,
        {
          date: new Date().toISOString(),
          action: 'Manual Lead Created',
          details: `Connected to new lead: ${lead.title}`
        }
      ];

      await query('UPDATE contacts SET activity_log = $1 WHERE id = $2', [JSON.stringify(updatedLog), matched.id]);
    }

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

    // Sync Recurring Task
    await syncRecurringTaskForLead(newLead.id);

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

    // 1. Strict Check for existing contact (Merge only if Name AND Phone match)
    let contactName = enquiry.name;
    const existingContact = await query(
      'SELECT id, name, phone, activity_log FROM contacts WHERE LOWER(name) = LOWER($1) AND phone = $2 LIMIT 1',
      [enquiry.name, enquiry.phone]
    );

    if (existingContact.rows.length === 0) {
      // 2. Create NEW contact if no safe match found
      console.log(`📝 Auto-creating individual contact: ${enquiry.name} (${enquiry.phone})`);

      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const datePrefix = `LA${yy}${mm}${dd} `;

      const todayContacts = await query(
        "SELECT contact_id FROM contacts WHERE contact_id LIKE $1 ORDER BY contact_id DESC LIMIT 1",
        [`${datePrefix}%`]
      );

      let sequence = 0;
      if (todayContacts.rows.length > 0) {
        const lastId = todayContacts.rows[0].contact_id;
        const lastSeq = parseInt(lastId.trim().slice(-3));
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
      }

      const generatedContactId = `${datePrefix}${String(sequence).padStart(3, '0')}`;

      await query(`
        INSERT INTO contacts (name, email, phone, contact_id, source, department, notes, checklist, activity_log, recorded_sessions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        generatedContactId,
        enquiry.source || 'Website',
        'Unassigned',
        `Interest: ${enquiry.interest}. Country: ${enquiry.country}. Message: ${enquiry.message}`,
        JSON.stringify(DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item, id: Date.now() + Math.random() }))),
        JSON.stringify([{ date: new Date().toISOString(), action: 'Enquiry Received', details: `Initial enquiry from ${enquiry.source || 'Website'}.` }]),
        '[]'
      ]);
    } else {
      // 2b. Safe Merge: Update history and fill in missing phone if applicable
      const matched = existingContact.rows[0];
      contactName = matched.name;
      console.log(`🔗 Safe Merging enquiry to: ${contactName} (ID: ${matched.id})`);

      // Update phone if the existing record was missing it
      if (!matched.phone && enquiry.phone) {
        await query('UPDATE contacts SET phone = $1 WHERE id = $2', [enquiry.phone, matched.id]);
      }

      const currentLog = Array.isArray(matched.activity_log) ? matched.activity_log : (typeof matched.activity_log === 'string' ? JSON.parse(matched.activity_log) : []);
      const updatedLog = [
        ...currentLog,
        {
          date: new Date().toISOString(),
          action: 'Secondary Enquiry',
          details: `New enquiry from ${enquiry.source || 'Website'}. Interest: ${enquiry.interest}.`
        }
      ];

      await query('UPDATE contacts SET activity_log = $1 WHERE id = $2', [JSON.stringify(updatedLog), matched.id]);
    }

    // 3. Create Lead from Enquiry (Always create a new lead)
    const leadResult = await query(`
      INSERT INTO leads(title, company, value, contact, stage, email, phone, source, assigned_to, notes, quotations)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      `${enquiry.source || 'Website'} Enquiry: ${enquiry.name}`, // Title
      'Individual',                                             // Company
      0,                                                        // Value
      contactName,                                              // Contact Name
      'New',                                                    // Stage
      enquiry.email,                                            // Email
      enquiry.phone,                                            // Phone
      enquiry.source || 'Website',                             // Source
      null,                                                     // Assigned To
      `Interest: ${enquiry.interest}. Country: ${enquiry.country}. Message: ${enquiry.message}`, // Notes
      JSON.stringify([])                                        // Quotations
    ]);

    const newLead = leadResult.rows[0];

    // 4. Sync recurring task for the new lead
    await syncRecurringTaskForLead(newLead.id);

    res.json({ success: true, message: 'Enquiry received and contact processed successfully' });
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
    const updatedLead = result.rows[0];

    // Sync Recurring Task
    await syncRecurringTaskForLead(updatedLead.id);

    res.json(transformLead(updatedLead));
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

// Create a new quotation for a lead
router.post('/leads/:id/quotations', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const quotationData = req.body;

    // 1. Fetch Lead
    const leadResult = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    const lead = leadResult.rows[0];
    let quotations = lead.quotations || [];
    if (typeof quotations === 'string') quotations = JSON.parse(quotations); // Safety check

    // 2. Generate Sequential ID
    let sequence = 1;
    // Find max QUO- ID across ALL leads
    const maxIdResult = await query(`
      SELECT q->>'id' as id 
      FROM leads l, jsonb_array_elements(l.quotations) q 
      WHERE q->>'id' LIKE 'QUO-%' 
      ORDER BY q->>'id' DESC 
      LIMIT 1
    `);

    if (maxIdResult.rows.length > 0) {
      const lastId = maxIdResult.rows[0].id;
      const parts = lastId.split('-');
      if (parts.length > 1) {
        const numPart = parseInt(parts[1], 10);
        if (!isNaN(numPart)) sequence = numPart + 1;
      }
    }

    let newId;
    let isUnique = false;
    while (!isUnique) {
      newId = `QUO-${String(sequence).padStart(6, '0')}`;
      // Collision check
      const check = await query(`
            SELECT 1 FROM leads l, jsonb_array_elements(l.quotations) q 
            WHERE q->>'id' = $1
        `, [newId]);
      if (check.rows.length === 0) {
        isUnique = true;
      } else {
        sequence++;
      }
    }

    // 3. Create Quotation Object
    const newQuotation = {
      ...quotationData,
      id: newId,
      status: quotationData.status || 'In Review',
      date: new Date().toISOString().split('T')[0]
    };

    // 4. Save
    quotations.push(newQuotation);
    await query('UPDATE leads SET quotations = $1 WHERE id = $2', [JSON.stringify(quotations), leadId]);

    // Return updated lead
    const updatedResult = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
    res.json(transformLead(updatedResult.rows[0]));

  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transactions routes
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    const transactions = result.rows.map(t => ({
      ...t,
      contactId: t.contact_id,
      customerName: t.customer_name, // Map snake_case to camelCase
      paymentMethod: t.payment_method,
      dueDate: t.due_date,
      additionalDiscount: t.additional_discount,
      metadata: typeof t.metadata === 'string' ? JSON.parse(t.metadata) : (t.metadata || {}),
      amount: Number(t.amount)
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

router.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
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

    // Generate Sequential ID
    let id = transaction.id;
    if (!id) {
      const typePrefixMap = {
        'Invoice': 'INV',
        'Bill': 'BILL',
        'Expense': 'EXP',
        'Transfer': 'TRF',
        'Purchase': 'PUR',
        'Income': 'INC'
      };
      const prefix = typePrefixMap[transaction.type] || 'TXN';

      // Find latest ID for this prefix to increment
      const maxSeqResult = await query("SELECT id FROM transactions WHERE id LIKE $1 ORDER BY id DESC LIMIT 1", [`${prefix}-%`]);
      let sequence = 1;

      if (maxSeqResult.rows.length > 0) {
        const lastId = maxSeqResult.rows[0].id; // e.g., INV-000005
        const parts = lastId.split('-');
        if (parts.length > 1) {
          const numPart = parseInt(parts[1], 10);
          if (!isNaN(numPart)) {
            sequence = numPart + 1;
          }
        }
      }

      // Collision Check Loop
      let isUnique = false;
      while (!isUnique) {
        const generatedId = `${prefix}-${String(sequence).padStart(6, '0')}`;
        const check = await query("SELECT id FROM transactions WHERE id = $1", [generatedId]);
        if (check.rows.length === 0) {
          id = generatedId;
          isUnique = true;
        } else {
          sequence++;
        }
      }
    }

    const result = await query(`
      INSERT INTO transactions(id, contact_id, customer_name, date, description, type, status, amount, payment_method, due_date, additional_discount, metadata)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      transaction.dueDate || null,
      transaction.additionalDiscount || 0,
      JSON.stringify(transaction.metadata || {})
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
            entry._lastDeduction = (entry._lastDeduction || 0) + deduction;
            arUpdated = true;
            return entry;
          });

          if (arUpdated) {
            await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), contactId]);

            // Track deductions in transaction metadata for future reversion
            const arDeductions = metadata.accountsReceivable
              .filter(e => e._lastDeduction > 0)
              .map(e => ({ id: e.id, amount: e._lastDeduction }));

            if (arDeductions.length > 0) {
              const currentTxMetadata = newTransaction.metadata || {};
              await query('UPDATE transactions SET metadata = $1 WHERE id = $2', [
                JSON.stringify({ ...currentTxMetadata, arDeductions }),
                newTransaction.id
              ]);
            }

            // Cleanup temporary tracking field
            metadata.accountsReceivable.forEach(e => delete e._lastDeduction);
            await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), contactId]);

            console.log(`✅ Updated AR for Contact ${contactId} based on Invoice ${newTransaction.id}`);
          }
        }
      } catch (arError) {
        console.error('Failed to update Accounts Receivable:', arError);
        // Do not fail the transaction creation itself
      }
    }

    res.json({
      ...newTransaction,
      contactId: newTransaction.contact_id,
      customerName: newTransaction.customer_name,
      paymentMethod: newTransaction.payment_method,
      dueDate: newTransaction.due_date,
      additionalDiscount: newTransaction.additional_discount,
      amount: Number(newTransaction.amount) // Ensure number
    });
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
      contact_id = $1, customer_name = $2, date = $3, description = $4, type = $5, status = $6, amount = $7, payment_method = $8, due_date = $9, additional_discount = $10, metadata = $11
      WHERE id = $12
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
      JSON.stringify(transaction.metadata || {}),
      req.params.id
    ]);
    const result = await query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    const updated = result.rows[0];
    res.json({
      ...updated,
      contactId: updated.contact_id,
      customerName: updated.customer_name,
      paymentMethod: updated.payment_method,
      dueDate: updated.due_date,
      additionalDiscount: updated.additional_discount,
      metadata: typeof updated.metadata === 'string' ? JSON.parse(updated.metadata) : (updated.metadata || {}),
      amount: Number(updated.amount)
    });
  } catch (error) {
    console.error('PUT /transactions/:id - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;

    // 1. Fetch transaction to check for AR deductions
    const txRes = await query('SELECT * FROM transactions WHERE id = $1', [transactionId]);
    if (txRes.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });

    const transaction = txRes.rows[0];
    const metadata = typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : (transaction.metadata || {});
    const arDeductions = metadata.arDeductions || [];
    const contactId = transaction.contact_id;

    // 2. Revert AR if deductions were tracked
    if (arDeductions.length > 0 && contactId) {
      try {
        const contactRes = await query('SELECT metadata FROM contacts WHERE id = $1', [contactId]);
        if (contactRes.rows.length > 0) {
          const contact = contactRes.rows[0];
          let contactMetadata = contact.metadata || {};
          if (typeof contactMetadata === 'string') {
            try { contactMetadata = JSON.parse(contactMetadata); } catch (e) { contactMetadata = {}; }
          }

          if (contactMetadata.accountsReceivable) {
            let contactUpdated = false;
            arDeductions.forEach(deduction => {
              const entry = contactMetadata.accountsReceivable.find(e => e.id === deduction.id);
              if (entry) {
                entry.remainingAmount = parseFloat(entry.remainingAmount) + parseFloat(deduction.amount);
                entry.paidAmount = Math.max(0, parseFloat(entry.paidAmount) - parseFloat(deduction.amount));

                // Revert status if it was 'Paid'
                if (entry.remainingAmount > 0) {
                  entry.status = entry.paidAmount > 0 ? 'Partial' : 'Outstanding';
                  delete entry.paidAt;
                }
                contactUpdated = true;
              }
            });

            if (contactUpdated) {
              await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(contactMetadata), contactId]);
              console.log(`♻️ Reverted AR deductions for Contact ${contactId} after deleting Transaction ${transactionId}`);
            }
          }
        }
      } catch (revertError) {
        console.error('Failed to revert AR deductions:', revertError);
        // We continue with deletion even if reversion fails to avoid blocking the user
      }
    }

    await query('DELETE FROM transactions WHERE id = $1', [transactionId]);
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
      // For Staff/Student: Show tasks where they are assigned, OR they created the task, OR linked to their contact
      const contactRes = await query('SELECT id FROM contacts WHERE user_id = $1', [req.user.id]);
      const contactId = contactRes.rows[0]?.id;

      if (req.user.role === 'Student') {
        // Student view: Only show tasks linked to their contact AND marked visible
        if (contactId) {
          q += ' WHERE (tasks.contact_id = $1 AND tasks.is_visible_to_student = true) OR (tasks.visibility_emails::jsonb @> $2::jsonb)';
          params.push(contactId);
          params.push(JSON.stringify([req.user.email]));
        } else {
          q += ' WHERE tasks.visibility_emails::jsonb @> $1::jsonb';
          params.push(JSON.stringify([req.user.email]));
        }
      } else {
        // Staff view: Show assigned to me, created by me (for 30 mins), or visibility emails matches
        q += ' WHERE tasks.assigned_to = $1 OR (tasks.assigned_by = $2 AND tasks.created_at >= NOW() - INTERVAL \'30 minutes\') OR tasks.visibility_emails::jsonb @> $3::jsonb';
        params.push(req.user.id);
        params.push(req.user.id);
        params.push(JSON.stringify([req.user.email]));
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
      while (params.length > 0) params.pop();
      params.push(req.query.contactId);
    } else if (req.query.recurringTaskId) {
      q = `
        SELECT tasks.*, contacts.name as contact_name 
        FROM tasks 
        LEFT JOIN contacts ON tasks.contact_id = contacts.id
        WHERE tasks.recurring_task_id = $1
      `;
      while (params.length > 0) params.pop();
      params.push(req.query.recurringTaskId);
    }

    // Only apply assigned_to filter if contactId and recurringTaskId are NOT provided (default behavior)
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

// Helper to get next sequential task ID
const getNextTaskId = async (prefix = 'TSK') => {
  // Check tasks table
  const lastTaskResult = await query(`SELECT task_id FROM tasks WHERE task_id ~ '^${prefix}-[0-9]{6}$' ORDER BY task_id DESC LIMIT 1`);

  // Check recurring_tasks table
  const lastRTResult = await query(`SELECT task_id FROM recurring_tasks WHERE task_id ~ '^${prefix}-[0-9]{6}$' ORDER BY task_id DESC LIMIT 1`);

  let maxNum = 0;
  if (lastTaskResult.rows.length > 0) {
    maxNum = Math.max(maxNum, parseInt(lastTaskResult.rows[0].task_id.split('-')[1], 10));
  }
  if (lastRTResult.rows.length > 0) {
    maxNum = Math.max(maxNum, parseInt(lastRTResult.rows[0].task_id.split('-')[1], 10));
  }

  let nextNum = maxNum + 1;
  let isUnique = false;
  let taskId;
  while (!isUnique) {
    taskId = `${prefix}-${String(nextNum).padStart(6, '0')}`;
    const existingTask = await query('SELECT id FROM tasks WHERE task_id = $1', [taskId]);
    const existingRT = await query('SELECT id FROM recurring_tasks WHERE task_id = $1', [taskId]);
    if (existingTask.rows.length === 0 && existingRT.rows.length === 0) {
      isUnique = true;
    } else {
      nextNum++;
    }
  }
  return taskId;
};

router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const task = req.body;

    // Generate sequential 6-digit Task ID
    const taskId = await getNextTaskId();

    const result = await query(`
      INSERT INTO tasks(
        task_id, title, description, due_date, status, assigned_to, assigned_by, priority, replies, contact_id, activity_type, is_visible_to_student, ticket_id
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      task.activityType || null,
      task.isVisibleToStudent || false,
      task.ticketId || null
    ]);

    // Create initial time log
    await query(`
      INSERT INTO task_time_logs (task_id, assigned_to)
      VALUES ($1, $2)
    `, [result.rows[0].id, task.assignedTo]);

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
  activityType: task.activity_type,
  isVisibleToStudent: task.is_visible_to_student,
  ticketId: task.ticket_id,
  visibilityEmails: task.visibility_emails,
  recurringTaskId: task.recurring_task_id
});

// Helper for recurring tasks
const transformRecurringTask = (rt) => ({
  ...rt,
  taskId: rt.task_id,
  leadId: rt.lead_id,
  contactId: rt.contact_id,
  frequencyDays: rt.frequency_days,
  lastGeneratedAt: rt.last_generated_at,
  nextGenerationAt: rt.next_generation_at,
  isActive: rt.is_active,
  assignedTo: rt.assigned_to,
  visibilityEmails: rt.visibility_emails,
  createdAt: rt.created_at,
  contactName: rt.contact_name
});

// Generate task instances
const generateTaskInstances = async () => {
  try {
    const now = new Date();
    // Fetch global assignee from settings
    const settingsRes = await query('SELECT value FROM system_settings WHERE key = $1', ['RECURRING_TASK_ASSIGNEE']);
    const globalAssigneeId = settingsRes.rows[0]?.value?.userId || null;

    const rtRes = await query(`
      SELECT DISTINCT ON (rt.id) rt.*, 
             COALESCE(l.contact, c.name) as contact_name, 
             COALESCE(l.phone, c.phone) as phone, 
             COALESCE(l.email, c.email) as email
      FROM recurring_tasks rt
      LEFT JOIN leads l ON rt.lead_id = l.id
      LEFT JOIN contacts c ON rt.contact_id = c.id
      WHERE rt.is_active = true 
        AND (rt.lead_id IS NOT NULL OR rt.contact_id IS NOT NULL)
        AND (rt.next_generation_at IS NULL OR rt.next_generation_at <= $1)
    `, [now]);

    for (const rt of rtRes.rows) {
      const nextGen = new Date(now.getTime() + rt.frequency_days * 24 * 60 * 60 * 1000);

      // Generate unique Task ID with TSK prefix for task instances
      const taskId = await getNextTaskId('TSK');

      await query(`
        INSERT INTO tasks(
          task_id, title, description, due_date, status, assigned_to, priority, visibility_emails, recurring_task_id, contact_id
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        taskId,
        rt.title,
        rt.description,
        new Date().toISOString().split('T')[0],
        'todo',
        rt.assigned_to || globalAssigneeId, // Use RT assignee, fallback to global
        'Medium',
        JSON.stringify(rt.visibility_emails || []),
        rt.id,
        rt.contact_id || null // Link the task to the contact if applicable
      ]);

      await query(`
        UPDATE recurring_tasks 
        SET last_generated_at = $1, next_generation_at = $2
        WHERE id = $3
      `, [now, nextGen, rt.id]);

      console.log(`🤖 Generated recurring task instance ${taskId} for LT-${rt.id}`);
    }
  } catch (err) {
    console.error('Error generating recurring task instances:', err);
  }
};

// Start scheduler (run every 10 minutes)
setInterval(generateTaskInstances, 10 * 60 * 1000);
// Run once on startup after a small delay
setTimeout(generateTaskInstances, 5000);

// Recurring task routes
router.get('/recurring-tasks', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT rt.*, 
             COALESCE(l.contact, c.name) as contact_name, 
             COALESCE(l.company, c.department) as company 
      FROM recurring_tasks rt
      LEFT JOIN leads l ON rt.lead_id = l.id
      LEFT JOIN contacts c ON rt.contact_id = c.id
      ORDER BY rt.created_at DESC
    `);
    res.json(result.rows.map(transformRecurringTask));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recurring task manually
router.post('/recurring-tasks', authenticateToken, async (req, res) => {
  try {
    const { leadId, contactId, title, description, frequencyDays, visibilityEmails, assignedTo } = req.body;

    // Generate task ID
    const taskId = await getNextTaskId('REQ');

    await query(`
      INSERT INTO recurring_tasks(task_id, lead_id, contact_id, title, description, frequency_days, next_generation_at, visibility_emails, assigned_to, is_active)
      VALUES($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, true)
    `, [
      taskId,
      leadId || null,
      contactId || null,
      title,
      description,
      frequencyDays || 2,
      JSON.stringify(visibilityEmails || []),
      assignedTo || null
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/recurring-tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { frequencyDays, visibilityEmails, isActive, assignedTo, title, description, contactId } = req.body;
    await query(
      'UPDATE recurring_tasks SET frequency_days = $1, visibility_emails = $2, is_active = $3, assigned_to = $4, title = $5, description = $6, contact_id = $7 WHERE id = $8',
      [frequencyDays, JSON.stringify(visibilityEmails), isActive, assignedTo || null, title, description, contactId || null, req.params.id]
    );

    // Also update visibility_emails and contact_id for all future tasks generated by this recurring task
    // We update existing tasks of this recurring task too for consistency
    await query('UPDATE tasks SET visibility_emails = $1, contact_id = $2 WHERE recurring_task_id = $3', [JSON.stringify(visibilityEmails || []), contactId || null, req.params.id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recurring task
router.delete('/recurring-tasks/:id', authenticateToken, async (req, res) => {
  try {
    // Delete the recurring task
    await query('DELETE FROM recurring_tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
      'title = $1', 'description = $2', 'due_date = $3', 'status = $4', 'assigned_to = $5', 'priority = $6', 'activity_type = $7', 'is_visible_to_student = $8'
    ];
    const updateParams = [
      task.title, task.description, task.dueDate, task.status, task.assignedTo, task.priority, task.activityType || null, task.isVisibleToStudent
    ];

    // Add replies if present
    if (task.replies !== undefined) {
      updateFields.push(`replies = $${updateParams.length + 1}`);
      updateParams.push(JSON.stringify(task.replies));
    }

    if (task.visibility_emails !== undefined) {
      updateFields.push(`visibility_emails = $${updateParams.length + 1}`);
      updateParams.push(JSON.stringify(task.visibility_emails));
    }

    if (task.contactId) {
      updateFields.push('contact_id = $' + (updateParams.length + 1));
      updateParams.push(task.contactId);
    }

    if (completedBy) {
      updateFields.push('completed_by = $' + (updateParams.length + 1));
      updateParams.push(completedBy);
      updateFields.push('completed_at = $' + (updateParams.length + 1));
      updateParams.push(completedAt);
    }

    // If status is NOT done, clear completion (optional, user asked?) - user said "record if done", implies history.
    // If reopening, maybe clear? Let's assume reopening clears completion info for accurate current status.
    if (task.status !== 'done') {
      updateFields.push(`completed_by = NULL`);
      updateFields.push(`completed_at = NULL`);
    }

    const q = 'UPDATE tasks SET ' + updateFields.join(', ') + ' WHERE id = $' + (updateParams.length + 1) + ' RETURNING *';
    updateParams.push(req.params.id);

    // Fetch existing task to check for assignment/status changes
    // Fetch existing task to check for assignment/status changes
    const beforeUpdate = await query('SELECT assigned_to, status FROM tasks WHERE id = $1', [req.params.id]);
    const previousAssignee = beforeUpdate.rows[0]?.assigned_to;
    const previousStatus = beforeUpdate.rows[0]?.status;

    const updated = await query(q, updateParams);
    const newStatus = task.status;
    const newAssignee = Number(task.assignedTo);

    // Task Time Logging Logic
    // 1. If assigned_to changed
    if (previousAssignee !== newAssignee) {
      // Close previous log
      await query(`
        UPDATE task_time_logs
        SET end_time = CURRENT_TIMESTAMP
        WHERE task_id = $1 AND assigned_to = $2 AND end_time IS NULL
      `, [req.params.id, previousAssignee]);

      // Start new log
      await query(`
        INSERT INTO task_time_logs (task_id, assigned_to)
        VALUES ($1, $2)
      `, [req.params.id, newAssignee]);
    }
    // 2. If status changed to 'done' (and wasn't before)
    else if (newStatus === 'done' && previousStatus !== 'done') {
      // Close the active log
      await query(`
        UPDATE task_time_logs
        SET end_time = CURRENT_TIMESTAMP
        WHERE task_id = $1 AND end_time IS NULL
      `, [req.params.id]);
    }
    // 3. If status changed *from* 'done' (reopened)
    else if (previousStatus === 'done' && newStatus !== 'done') {
      // Start a new log for current assignee
      await query(`
        INSERT INTO task_time_logs (task_id, assigned_to)
        VALUES ($1, $2)
      `, [req.params.id, newAssignee]);
    }

    res.json(transformTask(updated.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task time logs
router.get('/tasks/:id/logs', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        ttl.id,
        ttl.task_id as "taskId",
        ttl.assigned_to as "assignedTo",
        ttl.start_time as "startTime",
        ttl.end_time as "endTime",
        u.name as "assigneeName"
      FROM task_time_logs ttl
      LEFT JOIN users u ON ttl.assigned_to = u.id
      WHERE ttl.task_id = $1
      ORDER BY ttl.start_time ASC
    `, [req.params.id]);
    res.json(result.rows);
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

// ===== TASK ATTACHMENTS ROUTES =====

// Upload task attachment
router.post('/tasks/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { taskId } = req.body; // Optional: link to task immediately if provided

    const result = await query(`
      INSERT INTO task_attachments(filename, content_type, file_data, file_size, task_id)
      VALUES($1, $2, $3, $4, $5)
      RETURNING id, filename, content_type, file_size
    `, [req.file.originalname, req.file.mimetype, req.file.buffer, req.file.size, taskId || null]);

    const attachment = result.rows[0];
    res.json({
      id: attachment.id,
      name: attachment.filename,
      contentType: attachment.content_type,
      size: attachment.file_size,
      url: `/tasks/attachments/${attachment.id}`,
      taskId: taskId
    });
  } catch (error) {
    console.error('Error uploading task attachment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve task attachment
router.get('/tasks/attachments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT filename, content_type, file_data FROM task_attachments WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const { filename, content_type, file_data } = result.rows[0];
    const isPreview = req.query.preview === 'true';

    // Set headers
    res.setHeader('Content-Type', content_type);
    res.setHeader('Content-Disposition', `${isPreview ? 'inline' : 'attachment'}; filename="${filename}"`);

    // Send binary data
    res.send(file_data);
  } catch (error) {
    console.error('Error serving task attachment:', error);
    res.status(500).json({ error: error.message });
  }
});


// ===== TICKETS ROUTES =====

// Helper function to transform ticket from DB
const transformTicket = (ticket) => ({
  id: ticket.id,
  ticketId: ticket.ticket_id,
  contactId: ticket.contact_id,
  contactName: ticket.contact_name,
  subject: ticket.subject,
  description: ticket.description,
  status: ticket.status,
  priority: ticket.priority,
  assignedTo: ticket.assigned_to,
  assignedToName: ticket.assigned_to_name,
  category: ticket.category,
  createdBy: ticket.created_by,
  createdByName: ticket.created_by_name,
  resolutionNotes: ticket.resolution_notes,
  attachments: ticket.attachments || [],
  linkedTasks: ticket.linked_tasks || [],
  messages: ticket.messages || [],
  createdAt: ticket.created_at,
  updatedAt: ticket.updated_at
});

// Create ticket
router.post('/tickets', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { contactId, subject, description, priority, category } = req.body;

    // Generate unique ticket ID
    let ticketId;
    let isUnique = false;
    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 900000) + 100000;
      ticketId = `TKT-${randomNum}`;
      const existing = await client.query('SELECT id FROM tickets WHERE ticket_id = $1', [ticketId]);
      if (existing.rows.length === 0) isUnique = true;
    }

    // Get contact's assigned counselor(s)
    const contactResult = await client.query('SELECT counselor_assigned, counselor_assigned_2 FROM contacts WHERE id = $1', [contactId]);
    let assignedTo = null;
    if (contactResult.rows.length > 0) {
      const { counselor_assigned, counselor_assigned_2 } = contactResult.rows[0];
      const counselorName = counselor_assigned || counselor_assigned_2;

      if (counselorName) {
        // Find counselor by name (case-insensitive)
        const counselorResult = await client.query(
          'SELECT id FROM users WHERE name ILIKE $1 AND role IN ($2, $3)',
          [counselorName, 'Admin', 'Staff']
        );
        if (counselorResult.rows.length > 0) {
          assignedTo = counselorResult.rows[0].id;
        }
      }

      // If still no counselor assigned and it's a staff member creating, they become the assignee
      if (!assignedTo && req.user.role !== 'Student') {
        assignedTo = req.user.id;
      }
    }

    // Insert Ticket
    const ticketResult = await client.query(`
      INSERT INTO tickets(ticket_id, contact_id, subject, description, priority, assigned_to, created_by, status, category)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [ticketId, contactId, subject, description, priority || 'Medium', assignedTo, req.user.id, 'Open', category || 'Others']);

    const newTicket = ticketResult.rows[0];

    // Handle file attachments (Store in DB)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await client.query(`
          INSERT INTO ticket_attachments(ticket_id, filename, content_type, file_data, file_size)
          VALUES($1, $2, $3, $4, $5)
        `, [newTicket.id, file.originalname, file.mimetype, file.buffer, file.size]);
      }
    }

    await client.query('COMMIT');

    // Fetch the ticket with its attachments and names for the response
    const finalResult = await client.query(`
      SELECT t.*, c.name as contact_name, u1.name as assigned_to_name, u2.name as created_by_name,
        (SELECT json_agg(json_build_object('id', ta.id, 'name', ta.filename, 'size', ta.file_size))
         FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachments
      FROM tickets t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [newTicket.id]);

    res.json(transformTicket(finalResult.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Helper route to serve attachment binary data
router.get('/tickets/attachments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT ta.filename, ta.content_type, ta.file_data 
      FROM ticket_attachments ta
      JOIN tickets t ON ta.ticket_id = t.id
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE ta.id = $1 AND (
        $2 = 'Admin' OR 
        ($2 = 'Staff' AND (
          t.assigned_to = $3 OR t.created_by = $3 
          OR (t.assigned_to IS NULL AND (
              (c.counselor_assigned IS NULL AND c.counselor_assigned_2 IS NULL)
              OR c.counselor_assigned = $4
              OR c.counselor_assigned_2 = $4
          ))
        )) OR
        ($2 = 'Student' AND c.user_id = $3)
      )
    `, [req.params.id, req.user.role, req.user.id, req.user.name]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'Unauthorized: You do not have access to this attachment.' });

    const attachment = result.rows[0];
    res.setHeader('Content-Type', attachment.content_type);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);
    res.send(attachment.file_data);
  } catch (error) {
    console.error('Error serving attachment:', error);
    res.status(500).json({ error: 'Failed to serve attachment' });
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
        SELECT t.*, c.name as contact_name, 
               COALESCE(u1.name, c.counselor_assigned, c.counselor_assigned_2) as assigned_to_name, 
               u2.name as created_by_name,
               (SELECT json_agg(json_build_object('id', ta.id, 'name', ta.filename, 'size', ta.file_size))
                FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachments,
               (SELECT json_agg(json_build_object('id', tk.id, 'taskId', tk.task_id, 'title', tk.title, 'status', tk.status, 'isVisibleToStudent', tk.is_visible_to_student))
                FROM tasks tk WHERE tk.ticket_id = t.id) as linked_tasks
        FROM tickets t
        LEFT JOIN contacts c ON t.contact_id = c.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        ORDER BY t.created_at DESC
      `;
    } else if (req.user.role === 'Staff') {
      // Staff sees tickets assigned to them, created by them, or unassigned ones that match their counselor assignment
      queryText = `
        SELECT t.*, c.name as contact_name, 
               COALESCE(u1.name, c.counselor_assigned, c.counselor_assigned_2) as assigned_to_name, 
               u2.name as created_by_name,
               (SELECT json_agg(json_build_object('id', ta.id, 'name', ta.filename, 'size', ta.file_size))
                FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachments,
               (SELECT json_agg(json_build_object('id', tk.id, 'taskId', tk.task_id, 'title', tk.title, 'status', tk.status, 'isVisibleToStudent', tk.is_visible_to_student))
                FROM tasks tk WHERE tk.ticket_id = t.id) as linked_tasks
        FROM tickets t
        LEFT JOIN contacts c ON t.contact_id = c.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.assigned_to = $1 OR t.created_by = $1 
           OR (t.assigned_to IS NULL AND (
               (c.counselor_assigned IS NULL AND c.counselor_assigned_2 IS NULL)
               OR c.counselor_assigned = $2
               OR c.counselor_assigned_2 = $2
           ))
        ORDER BY t.created_at DESC
      `;
      params = [req.user.id, req.user.name];
    } else if (req.user.role === 'Student') {
      // Students see their own tickets
      const contactResult = await query('SELECT id FROM contacts WHERE user_id = $1', [req.user.id]);
      if (contactResult.rows.length === 0) {
        return res.json([]);
      }

      queryText = `
        SELECT t.*, c.name as contact_name, 
               COALESCE(u1.name, c.counselor_assigned, c.counselor_assigned_2) as assigned_to_name, 
               u2.name as created_by_name,
               (SELECT json_agg(json_build_object('id', ta.id, 'name', ta.filename, 'size', ta.file_size))
                FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachments,
               (SELECT json_agg(json_build_object('id', tk.id, 'taskId', tk.task_id, 'title', tk.title, 'status', tk.status, 'isVisibleToStudent', tk.is_visible_to_student))
                FROM tasks tk WHERE tk.ticket_id = t.id AND tk.is_visible_to_student = true) as linked_tasks
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
    const tickets = result.rows.map(row => transformTicket(row));

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
      SELECT t.*, c.name as contact_name, 
             COALESCE(u1.name, c.counselor_assigned, c.counselor_assigned_2) as assigned_to_name, 
             u2.name as created_by_name,
             (SELECT json_agg(json_build_object('id', ta.id, 'name', ta.filename, 'size', ta.file_size))
              FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachments,
             (SELECT json_agg(json_build_object('id', tk.id, 'taskId', tk.task_id, 'title', tk.title, 'status', tk.status, 'isVisibleToStudent', tk.is_visible_to_student))
              FROM tasks tk WHERE tk.ticket_id = t.id) as linked_tasks,
             (SELECT json_agg(json_build_object('id', tm.id, 'message', tm.message, 'senderId', tm.sender_id, 'senderName', u.name, 'createdAt', tm.created_at))
              FROM ticket_messages tm
              LEFT JOIN users u ON tm.sender_id = u.id
              WHERE tm.ticket_id = t.id
              ORDER BY tm.created_at ASC) as messages
      FROM tickets t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1 AND (
        $2 = 'Admin' OR 
        ($2 = 'Staff' AND (
          t.assigned_to = $3 OR t.created_by = $3 
          OR (t.assigned_to IS NULL AND (
              (c.counselor_assigned IS NULL AND c.counselor_assigned_2 IS NULL)
              OR c.counselor_assigned = $4
              OR c.counselor_assigned_2 = $4
          ))
        )) OR
        ($2 = 'Student' AND c.user_id = $3)
      )
    `, [req.params.id, req.user.role, req.user.id, req.user.name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = transformTicket(result.rows[0]);

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket
router.put('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assignedTo, resolutionNotes, category } = req.body;

    const result = await query(`
      UPDATE tickets 
      SET status = $1, priority = $2, assigned_to = $3, resolution_notes = $4, updated_at = CURRENT_TIMESTAMP, category = $9
      WHERE id = $5 AND EXISTS (
        SELECT 1 FROM tickets t2
        LEFT JOIN contacts c ON t2.contact_id = c.id
        WHERE t2.id = $5 AND (
          $6 = 'Admin' OR
          ($6 = 'Staff' AND (
            t2.assigned_to = $7 OR t2.created_by = $7 
            OR (t2.assigned_to IS NULL AND (
                (c.counselor_assigned IS NULL AND c.counselor_assigned_2 IS NULL)
                OR c.counselor_assigned = $8
                OR c.counselor_assigned_2 = $8
            ))
          ))
        )
      )
      RETURNING *
    `, [status, priority, assignedTo, resolutionNotes, req.params.id, req.user.role, req.user.id, req.user.name, category]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: You do not have permission to update this ticket.' });
    }

    // Fetch the full record with names after update
    const finalResult = await query(`
      SELECT t.*, c.name as contact_name, 
             COALESCE(u1.name, c.counselor_assigned, c.counselor_assigned_2) as assigned_to_name, 
             u2.name as created_by_name,
             (SELECT json_agg(json_build_object('id', ta.id, 'name', ta.filename, 'size', ta.file_size))
              FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachments
      FROM tickets t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [req.params.id]);

    res.json(transformTicket(finalResult.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link an existing task to a ticket
router.post('/tickets/:id/link-task', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.body; // This is the human-readable taskId like TSK-12345
    const ticketId = req.params.id;

    // Check if task exists
    const taskResult = await query('SELECT id, assigned_to FROM tasks WHERE task_id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Update task to link to ticket
    await query('UPDATE tasks SET ticket_id = $1 WHERE task_id = $2', [ticketId, taskId]);

    res.json({ success: true, message: 'Task linked successfully' });
  } catch (error) {
    console.error('Error linking task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unlink a task from a ticket
router.post('/tickets/:id/unlink-task', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.body; // This is the internal DB id of the task
    const ticketId = req.params.id;

    // Update task to remove link from ticket
    await query('UPDATE tasks SET ticket_id = NULL WHERE id = $1 AND ticket_id = $2', [taskId, ticketId]);

    res.json({ success: true, message: 'Task unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ticket messages
router.get('/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT tm.*, u.name as sender_name
      FROM ticket_messages tm
      LEFT JOIN users u ON tm.sender_id = u.id
      JOIN tickets t ON tm.ticket_id = t.id
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE tm.ticket_id = $1 AND (
        $2 = 'Admin' OR 
        ($2 = 'Staff' AND (
          t.assigned_to = $3 OR t.created_by = $3 
          OR (t.assigned_to IS NULL AND (
              (c.counselor_assigned IS NULL AND c.counselor_assigned_2 IS NULL)
              OR c.counselor_assigned = $4
              OR c.counselor_assigned_2 = $4
          ))
        )) OR
        ($2 = 'Student' AND c.user_id = $3)
      )
      ORDER BY tm.created_at ASC
    `, [req.params.id, req.user.role, req.user.id, req.user.name]);

    res.json(result.rows.map(row => ({
      ...row,
      senderName: row.sender_name,
      senderId: row.sender_id,
      createdAt: row.created_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send ticket message
router.post('/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const ticketId = req.params.id;
    const senderId = req.user.id;

    // Check if ticket is closed or resolved AND if user has access
    const ticketCheck = await query(`
      SELECT t.status FROM tickets t
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE t.id = $1 AND(
    $2 = 'Admin' OR
    ($2 = 'Staff' AND(
      t.assigned_to = $3 OR t.created_by = $3 
          OR(t.assigned_to IS NULL AND(
        (c.counselor_assigned IS NULL AND c.counselor_assigned_2 IS NULL)
              OR c.counselor_assigned = $4
              OR c.counselor_assigned_2 = $4
      ))
    )) OR
      ($2 = 'Student' AND c.user_id = $3)
      )
`, [ticketId, req.user.role, req.user.id, req.user.name]);

    if (ticketCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: You do not have access to this ticket.' });
    }

    const { status } = ticketCheck.rows[0];
    if (['Resolved', 'Closed'].includes(status)) {
      return res.status(403).json({ error: 'Cannot send messages on a resolved or closed ticket' });
    }

    const result = await query(`
      INSERT INTO ticket_messages (ticket_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [ticketId, senderId, message]);

    const newMessage = result.rows[0];

    // Get sender name
    const userResult = await query('SELECT name FROM users WHERE id = $1', [senderId]);
    newMessage.senderName = userResult.rows[0].name;

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ticket
router.delete('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const deleteResult = await query(`
      DELETE FROM tickets 
      WHERE id = $1 AND (
        $2 = 'Admin' OR -- Typically only admins delete, but if staff can:
        ($2 = 'Staff' AND created_by = $3)
      )
    `, [req.params.id, req.user.role, req.user.id]);

    if (deleteResult.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized or ticket not found' });
    }
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
router.get('/channels', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;

    // If Admin is auditing another user
    if (userId && req.user.role === 'Admin') {
      const result = await query(`
        SELECT * FROM channels 
        WHERE members @> $1::jsonb
      `, [JSON.stringify([parseInt(userId)])]);
      return res.json(result.rows);
    }

    // Normal behavior: only return channels where user is a member
    const result = await query(`
      SELECT * FROM channels 
      WHERE members @> $1::jsonb
    `, [JSON.stringify([req.user.id])]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/channels', authenticateToken, async (req, res) => {
  try {
    const channel = req.body;
    const id = channel.id || `channel - ${Date.now()} `;

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
    const result = await query(`
      INSERT INTO channels(id, name, type, members, messages)
      VALUES($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        members = EXCLUDED.members,
        messages = EXCLUDED.messages
      RETURNING *
    `, [
      req.params.id,
      channel.name,
      channel.type,
      JSON.stringify(channel.members || []),
      JSON.stringify(channel.messages || [])
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload channel attachment
router.post('/channels/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await query(`
      INSERT INTO channel_attachments(filename, content_type, file_data, file_size)
      VALUES($1, $2, $3, $4)
      RETURNING id, filename, content_type, file_size
    `, [req.file.originalname, req.file.mimetype, req.file.buffer, req.file.size]);

    const attachment = result.rows[0];
    res.json({
      id: attachment.id,
      name: attachment.filename,
      contentType: attachment.content_type,
      size: attachment.file_size,
      url: `/channels/attachments/${attachment.id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve channel attachment
router.get('/channels/attachments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT filename, content_type, file_data FROM channel_attachments WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const { filename, content_type, file_data } = result.rows[0];
    res.set({
      'Content-Type': content_type,
      'Content-Disposition': `inline; filename="${filename}"`
    });
    res.send(file_data);
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

router.post('/lms-courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { contactId, generateInvoice, markAsPaid, paymentMethod, price } = req.body;

    if (!contactId) return res.status(400).json({ error: 'Contact ID is required' });

    // 1. Get Course details
    const courseRes = await query('SELECT * FROM lms_courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    const course = courseRes.rows[0];

    // 2. Get Contact
    const contactRes = await query('SELECT * FROM contacts WHERE id = $1', [contactId]);
    if (contactRes.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });
    const contact = contactRes.rows[0];

    // 3. Update Contact Enrollment
    let courses = Array.isArray(contact.courses) ? contact.courses : JSON.parse(contact.courses || '[]');
    if (!courses.includes(courseId)) {
      courses.push(courseId);
    }

    let lmsProgress = typeof contact.lms_progress === 'string' ? JSON.parse(contact.lms_progress || '{}') : (contact.lms_progress || {});
    if (!lmsProgress[courseId]) {
      lmsProgress[courseId] = { completedLessons: [] };
    }

    await query('UPDATE contacts SET courses = $1, lms_progress = $2 WHERE id = $3', [
      JSON.stringify(courses),
      JSON.stringify(lmsProgress),
      contactId
    ]);

    // 4. Generate Invoice (if requested)
    if (generateInvoice) {
      // Generate Sequential Invoice ID
      let transactionId;
      let sequence = 1;

      // Find latest Invoice ID
      const maxSeqResult = await query("SELECT id FROM transactions WHERE id LIKE 'INV-%' ORDER BY id DESC LIMIT 1");
      if (maxSeqResult.rows.length > 0) {
        const lastId = maxSeqResult.rows[0].id;
        const parts = lastId.split('-');
        if (parts.length > 1) {
          const numPart = parseInt(parts[1], 10);
          if (!isNaN(numPart)) sequence = numPart + 1;
        }
      }

      let isUnique = false;
      while (!isUnique) {
        transactionId = `INV-${String(sequence).padStart(6, '0')}`;
        const check = await query("SELECT id FROM transactions WHERE id = $1", [transactionId]);
        if (check.rows.length === 0) {
          isUnique = true;
        } else {
          sequence++;
        }
      }

      const description = `Enrollment in ${course.title} `;
      const status = markAsPaid ? 'Paid' : 'Due';
      const type = 'Invoice';
      const date = new Date().toISOString().split('T')[0];

      await query(`
        INSERT INTO transactions(id, contact_id, customer_name, date, description, type, status, amount, payment_method)
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
        transactionId,
        contactId,
        contact.name,
        date,
        description,
        type,
        status,
        price,
        markAsPaid ? paymentMethod : null
      ]);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Enrollment error:', error);
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
    const { search } = req.query;
    let result;
    if (search) {
      result = await query(`
        SELECT * FROM activity_log 
        WHERE admin_name ILIKE $1 OR action ILIKE $1 
        ORDER BY timestamp DESC LIMIT 200
      `, [`%${search}%`]);
    } else {
      result = await query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100');
    }
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
      INSERT INTO system_settings(key, value)
VALUES($1, $2)
      ON CONFLICT(key) DO UPDATE SET value = $2
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

// Payment Settings
router.get('/settings/payment', authenticateToken, async (req, res) => {
  try {
    const upiResult = await query('SELECT value FROM system_settings WHERE key = $1', ['PAYMENT_UPI_ID']);
    const qrResult = await query('SELECT value FROM system_settings WHERE key = $1', ['PAYMENT_QR_CODE']);

    res.json({
      upiId: upiResult.rows[0]?.value?.upiId || '',
      qrCode: qrResult.rows[0]?.value?.qrCode || null // This will be the base64 data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/payment', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { upiId } = req.body;
    await query(`
      INSERT INTO system_settings(key, value)
      VALUES($1, $2)
      ON CONFLICT(key) DO UPDATE SET value = $2
    `, ['PAYMENT_UPI_ID', { upiId }]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/payment-qr', authenticateToken, requireRole('Admin'), upload.single('qrCode'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    await query(`
      INSERT INTO system_settings(key, value)
      VALUES($1, $2)
      ON CONFLICT(key) DO UPDATE SET value = $2
    `, ['PAYMENT_QR_CODE', { qrCode: base64Data }]);

    res.json({ success: true, qrCode: base64Data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings/:key', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT value FROM system_settings WHERE key = $1', [req.params.key]);
    res.json(result.rows[0]?.value || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/:key', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { value } = req.body;
    await query(`
      INSERT INTO system_settings(key, value)
      VALUES($1, $2)
      ON CONFLICT(key) DO UPDATE SET value = $2
    `, [req.params.key, value]);
    res.json({ success: true });
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
        return res.status(400).json({ error: `You are ${(dist - 50).toFixed(0)}m away from office.Must be within 50m.` });
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
      INSERT INTO attendance_logs(user_id, date, check_in, status)
VALUES($1, $2, NOW(), $3)
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
        return res.status(400).json({ error: `You are ${(dist - 50).toFixed(0)}m away.Must be within 50m.` });
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
      INSERT INTO leave_requests(user_id, start_date, end_date, reason)
VALUES($1, $2, $3, $4)
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

    const startDate = `${year} -${String(month).padStart(2, '0')}-01`;
    // Calculate end date (last day of month)
    const endDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year} -${String(month).padStart(2, '0')} -${endDay} `;

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
// trigger reload 1770196752
// trigger reload 1770196793
// trigger reload 1770196806
