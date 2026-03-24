import express from 'express';
import fetch from 'node-fetch';
import { query, getClient } from '../database.js';
import { authenticateToken, requireRole } from '../auth.js';
import { evaluateAutomation } from '../automation.js';
import { sendAnnouncementEmail } from '../email.js';

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

      const newDoc = result.rows[0];

      // AUTOMATION HOOK
      evaluateAutomation('Document Uploaded', {
        contact_id: contactId,
        document_name: file.originalname,
        category: category || 'General',
        document_id: newDoc.id,
        'document_date&time': new Date(newDoc.uploaded_at).toLocaleString(),
        document_uploader_name: req.user.name,
        document_uploader_email: req.user.email
      });

      res.json(newDoc);
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



router.put('/documents/:id/toggle-privacy', authenticateToken, async (req, res) => {
  try {
    // Only Staff/Admin can toggle privacy
    if (req.user.role !== 'Admin' && req.user.role !== 'Staff') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(`
      UPDATE documents 
      SET is_private = NOT is_private 
      WHERE id = $1 
      RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
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
    // Automation Trigger
    evaluateAutomation('User Created', user);

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
    degree: dbContact.degree,
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
        const raw = dbContact.checklist;
        const parsed = (Array.isArray(raw) || (raw && typeof raw === 'object')) ? raw : JSON.parse(raw && raw.trim() ? raw : '[]');
        return (Array.isArray(parsed) && parsed.length > 0) ? parsed : DEFAULT_CHECKLIST_ITEMS;
      } catch {
        return DEFAULT_CHECKLIST_ITEMS;
      }
    })(),
    activityLog: (() => { try { return (Array.isArray(dbContact.activity_log) || (dbContact.activity_log && typeof dbContact.activity_log === 'object')) ? dbContact.activity_log : JSON.parse(dbContact.activity_log && dbContact.activity_log.trim() ? dbContact.activity_log : '[]'); } catch { return []; } })(),
    recordedSessions: (() => { try { return (Array.isArray(dbContact.recorded_sessions) || (dbContact.recorded_sessions && typeof dbContact.recorded_sessions === 'object')) ? dbContact.recorded_sessions : JSON.parse(dbContact.recorded_sessions && dbContact.recorded_sessions.trim() ? dbContact.recorded_sessions : '[]'); } catch { return []; } })(),
    documents: (() => { try { return (Array.isArray(dbContact.documents) || (dbContact.documents && typeof dbContact.documents === 'object')) ? dbContact.documents : JSON.parse(dbContact.documents && dbContact.documents.trim() ? dbContact.documents : '[]'); } catch { return []; } })(),
    visaInformation: (() => { try { return (typeof dbContact.visa_information === 'object' && dbContact.visa_information !== null) ? dbContact.visa_information : JSON.parse(dbContact.visa_information && dbContact.visa_information.trim() ? dbContact.visa_information : '{}'); } catch { return {}; } })(),
    lmsProgress: (() => { try { return (typeof dbContact.lms_progress === 'object' && dbContact.lms_progress !== null) ? dbContact.lms_progress : JSON.parse(dbContact.lms_progress && dbContact.lms_progress.trim() ? dbContact.lms_progress : '{}'); } catch { return {}; } })(),
    lmsNotes: (() => { try { return (typeof dbContact.lms_notes === 'object' && dbContact.lms_notes !== null) ? dbContact.lms_notes : JSON.parse(dbContact.lms_notes && dbContact.lms_notes.trim() ? dbContact.lms_notes : '{}'); } catch { return {}; } })(),
    courses: (() => { try { return (Array.isArray(dbContact.courses) || (dbContact.courses && typeof dbContact.courses === 'object')) ? dbContact.courses : JSON.parse(dbContact.courses && dbContact.courses.trim() ? dbContact.courses : '[]'); } catch { return []; } })(),
    metadata: (() => { try { return (typeof dbContact.metadata === 'object' && dbContact.metadata !== null) ? dbContact.metadata : JSON.parse(dbContact.metadata && dbContact.metadata.trim() ? dbContact.metadata : '{}'); } catch { return {}; } })()
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

// ============================================================
// DOCUMENT SUBMISSION ROUTES (for Document Manager workflow)
// ============================================================

// POST /document-submissions - Upload a new submission (Student only)
router.post('/document-submissions', authenticateToken, async (req, res) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });

      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      // Get contact for this user
      const contactRes = await query('SELECT id FROM contacts WHERE user_id = $1', [req.user.id]);
      if (contactRes.rows.length === 0) {
        return res.status(404).json({ error: 'Contact record not found for this user' });
      }
      const contactId = contactRes.rows[0].id;
      const category = req.body.category || null;

      const result = await query(`
        INSERT INTO document_submissions (contact_id, user_id, filename, content_type, file_data, file_size, category, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING id, contact_id, user_id, filename, content_type, file_size, category, status, created_at
      `, [contactId, req.user.id, file.originalname, file.mimetype, file.buffer, file.size, category]);

      res.json(result.rows[0]);
    });
  } catch (error) {
    console.error('Error uploading submission:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /document-submissions - List submissions
// Students see only their own; Staff/Admin see all
router.get('/document-submissions', authenticateToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'Student') {
      result = await query(`
        SELECT ds.id, ds.contact_id, ds.filename, ds.content_type, ds.file_size, ds.category,
               ds.status, ds.rejection_reason, ds.created_at, ds.reviewed_at,
               u.name as reviewed_by_name
        FROM document_submissions ds
        LEFT JOIN users u ON ds.reviewed_by = u.id
        WHERE ds.user_id = $1
        ORDER BY ds.created_at DESC
      `, [req.user.id]);
    } else {
      result = await query(`
        SELECT ds.id, ds.contact_id, ds.filename, ds.content_type, ds.file_size, ds.category,
               ds.status, ds.rejection_reason, ds.created_at, ds.reviewed_at,
               sub_user.name as student_name, sub_user.email as student_email,
               u.name as reviewed_by_name, c.contact_id as contact_ref
        FROM document_submissions ds
        LEFT JOIN users sub_user ON ds.user_id = sub_user.id
        LEFT JOIN users u ON ds.reviewed_by = u.id
        LEFT JOIN contacts c ON ds.contact_id = c.id
        ORDER BY ds.created_at DESC
      `);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /document-submissions/:id/file - Preview/download a submission file
router.get('/document-submissions/:id/file', authenticateToken, async (req, res) => {
  try {
    const subId = parseInt(req.params.id);
    const result = await query('SELECT * FROM document_submissions WHERE id = $1', [subId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });

    const doc = result.rows[0];

    // Students can only access their own submissions
    if (req.user.role === 'Student' && doc.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const isPreview = req.query.preview === 'true';
    res.setHeader('Content-Type', doc.content_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${isPreview ? 'inline' : 'attachment'}; filename="${doc.filename}"`);
    res.send(doc.file_data);
  } catch (error) {
    console.error('Error serving submission file:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /document-submissions/:id - Delete a pending submission (Student or Staff/Admin)
router.delete('/document-submissions/:id', authenticateToken, async (req, res) => {
  try {
    const subId = parseInt(req.params.id);
    const result = await query('SELECT * FROM document_submissions WHERE id = $1', [subId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });

    const sub = result.rows[0];

    // Students can only delete their own pending submissions
    if (req.user.role === 'Student') {
      if (sub.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
      if (sub.status !== 'pending') return res.status(400).json({ error: 'Cannot delete a reviewed submission' });
    }

    await query('DELETE FROM document_submissions WHERE id = $1', [subId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Naming Convention Helpers ────────────────────────────────────────────────
/**
 * Short aliases for long or special-character category names.
 * Format: StudentName_Category_YYYYMMDD_HHMMSS_SubmissionID.ext (IST timezone)
 */
const CATEGORY_ALIASES = {
  "IELTS/PTE/TOEFL Score": "score",
  "LOR's": "lors",
  "SOP (Statement of Purpose)": "sop",
  "CV (Curriculum Vitae)": "cv",
  "Affidavit of Support": "aos",
  "Individual Memos": "memos",
  "Provisional Certificate": "pc",
  "Consolidated Marks Memo (CMM)": "cmm",
  "Original Degree (OD)": "od",
};

const buildApprovedFilename = (contactName, category, submissionId, originalFilename) => {
  // 1. Sanitize student name: strip special chars, collapse whitespace
  const sanitizedName = (contactName || 'Unknown')
    .normalize('NFD')                         // decompose accents
    .replace(/[\u0300-\u036f]/g, '')          // strip accent marks
    .replace(/[^a-zA-Z0-9\s]/g, '')          // remove all non-alphanumeric
    .trim()
    .replace(/\s+/g, '');                     // remove spaces → PascalCase run-on

  // 2. Normalize category using alias map, or auto-normalize
  const catKey = (category || 'document').trim();
  const catNorm = CATEGORY_ALIASES[catKey] !== undefined
    ? CATEGORY_ALIASES[catKey]
    : catKey
      .replace(/[^a-zA-Z0-9\s]/g, '_')     // special chars → underscore
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();

  // 3. IST timestamp (UTC+05:30)
  const now = new Date();
  const istMs = now.getTime() + (5.5 * 60 * 60 * 1000);
  const ist = new Date(istMs);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${ist.getUTCFullYear()}${pad(ist.getUTCMonth() + 1)}${pad(ist.getUTCDate())}`;
  const timeStr = `${pad(ist.getUTCHours())}${pad(ist.getUTCMinutes())}${pad(ist.getUTCSeconds())}`;

  // 4. Preserve original extension
  const dotIdx = (originalFilename || '').lastIndexOf('.');
  const ext = dotIdx >= 0 ? originalFilename.slice(dotIdx).toLowerCase() : '';

  return `${sanitizedName}_${catNorm}_${dateStr}_${timeStr}_${submissionId}${ext}`;
};
// ──────────────────────────────────────────────────────────────────────────────

// POST /document-submissions/:id/approve - Approve a submission (Staff/Admin only)
router.post('/document-submissions/:id/approve', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const subId = parseInt(req.params.id);
    const subResult = await query('SELECT * FROM document_submissions WHERE id = $1', [subId]);
    if (subResult.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });

    const sub = subResult.rows[0];

    // Fetch student's contact name for the filename
    const contactResult = await query('SELECT name FROM contacts WHERE id = $1', [sub.contact_id]);
    const contactName = contactResult.rows[0]?.name || 'Unknown';

    // Build the standardized approved filename
    const approvedFilename = buildApprovedFilename(contactName, sub.category, subId, sub.filename);

    // Copy file into the main documents table with the new standardized name
    const docResult = await query(`
      INSERT INTO documents (contact_id, name, type, size, content, is_private, category)
      VALUES ($1, $2, $3, $4, $5, false, $6)
      RETURNING id, contact_id, name, type, size, uploaded_at, category
    `, [sub.contact_id, approvedFilename, sub.content_type, sub.file_size, sub.file_data, sub.category]);

    // Update submission status
    await query(`
      UPDATE document_submissions
      SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
      WHERE id = $2
    `, [req.user.id, subId]);

    // Create in-app notification for student
    await query(`
      INSERT INTO notifications (title, description, recipient_user_ids, link_to)
      SELECT
        'Document Approved ✅',
        $1,
        to_jsonb(ARRAY[user_id]),
        '{"app": "Document manager"}'::jsonb
      FROM document_submissions WHERE id = $2
    `, [`Your document "${sub.filename}" has been approved and saved as "${approvedFilename}".`, subId]);

    res.json({ success: true, document: docResult.rows[0], approvedFilename });

    // --- TRIGGER AUTOMATION ---
    try {
      // Fetch full contact and staff info for automation payload
      const fullDataResult = await query(`
        SELECT 
          c.name as client_name, c.email as client_email, c.phone, c.department, c.major, c.id as contact_id,
          u.name as staff_name, u.email as staff_email
        FROM contacts c
        LEFT JOIN users u ON u.id = $1
        WHERE c.id = $2
      `, [req.user.id, sub.contact_id]);

      if (fullDataResult.rows.length > 0) {
        const data = fullDataResult.rows[0];
        const payload = {
          ...data,
          document_name: sub.filename,
          document_category: sub.category,
          approved_filename: approvedFilename,
          status: 'approved',
          submission_id: subId
        };
        // Fire and forget (don't await to avoid blocking response)
        evaluateAutomation('Document Approved', payload);
      }
    } catch (autoErr) {
      console.error('🤖 [Automation] Trigger failed for Document Approved:', autoErr);
    }
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: error.message });
  }
});


// POST /document-submissions/:id/reject - Reject a submission (Staff/Admin only)
router.post('/document-submissions/:id/reject', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const subId = parseInt(req.params.id);
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A rejection reason is required' });
    }

    const subResult = await query('SELECT * FROM document_submissions WHERE id = $1', [subId]);
    if (subResult.rows.length === 0) return res.status(404).json({ error: 'Submission not found' });

    const sub = subResult.rows[0];

    await query(`
      UPDATE document_submissions
      SET status = 'rejected', rejection_reason = $1, reviewed_at = NOW(), reviewed_by = $2
      WHERE id = $3
    `, [reason.trim(), req.user.id, subId]);

    // Create in-app notification for student
    await query(`
      INSERT INTO notifications (title, description, recipient_user_ids, link_to)
      SELECT
        'Document Rejected ❌',
        $1,
        to_jsonb(ARRAY[user_id]),
        '{"app": "Document manager"}'::jsonb
      FROM document_submissions WHERE id = $2
    `, [`Your document "${sub.filename}" was rejected. Reason: ${reason.trim()}`, subId]);

    res.json({ success: true });

    // --- TRIGGER AUTOMATION ---
    try {
      const fullDataResult = await query(`
        SELECT 
          c.name as client_name, c.email as client_email, c.phone, c.department, c.major, c.id as contact_id,
          u.name as staff_name, u.email as staff_email
        FROM contacts c
        LEFT JOIN users u ON u.id = $1
        WHERE c.id = $2
      `, [req.user.id, sub.contact_id]);

      if (fullDataResult.rows.length > 0) {
        const data = fullDataResult.rows[0];
        const payload = {
          ...data,
          document_name: sub.filename,
          document_category: sub.category,
          rejection_reason: reason.trim(),
          status: 'rejected',
          submission_id: subId
        };
        evaluateAutomation('Document Rejected', payload);
      }
    } catch (autoErr) {
      console.error('🤖 [Automation] Trigger failed for Document Rejected:', autoErr);
    }
  } catch (error) {
    console.error('Error rejecting submission:', error);
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

// ACK Number Generation
router.get('/next-ack-number', authenticateToken, async (req, res) => {
  try {
    const result = await query("SELECT nextval('application_ack_seq') as seq");
    const seq = result.rows[0].seq;
    const ackNumber = `ACK-${String(seq).padStart(7, '0')}`;
    res.json({ ackNumber });
  } catch (error) {
    console.error('Error generating ACK number:', error);
    res.status(500).json({ error: 'Failed to generate ACK number' });
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
    country, gstin, pan, tags, visa_type, degree, country_of_application, source, contact_type,
    stream, intake, counselor_assigned, counselor_assigned_2, application_email, application_password, avatar_url, metadata
  ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
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
      contact.degree || null,
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
    const newContact = transformContact(result.rows[0]);

    // Automation Trigger
    evaluateAutomation('Contact Created', {
      ...newContact,
      contact_name: newContact.name,
      contact_email: newContact.email,
      contact_phone: newContact.phone
    });

    res.json(newContact);
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

    // 5. Recurring Tasks: Delete
    await query('DELETE FROM recurring_tasks WHERE contact_id = $1', [contactId]);

    // 6. Visa Operations: Delete (these are specific to a contact)
    await query('DELETE FROM visa_operations WHERE contact_id = $1', [contactId]);

    // Finally, delete the contact
    await query('DELETE FROM contacts WHERE id = $1', [contactId]);

    // If contact has a linked user, attempt to delete the user account as well
    if (contact.user_id) {
      // Check if there are ANY OTHER contacts tied to this same user_id (e.g., duplicates)
      const otherContactsQuery = await query('SELECT id FROM contacts WHERE user_id = $1', [contact.user_id]);

      if (otherContactsQuery.rows.length > 0) {
        console.log(`Skipping user account deletion (ID: ${contact.user_id}) because other contacts reference it.`);
      } else {
        try {
          await query('DELETE FROM users WHERE id = $1', [contact.user_id]);
          console.log(`Associated user account (ID: ${contact.user_id}) deleted for contact ${contactId}`);
        } catch (userDeleteError) {
          console.warn(`Could not delete associated user (ID: ${contact.user_id}) due to foreign key constraints in other tables. Skipping user deletion.`);
        }
      }
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

    // Fetch full existing contact for automation comparison
    const oldContactFullRes = await query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    const oldContact = transformContact(oldContactFullRes.rows[0]);

    if (!oldContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const nameChanged = oldContact.name !== contact.name;

    // Merge metadata to prevent losing accountsReceivable or other fields
    let existingMetadata = oldContact.metadata || {};
    if (typeof existingMetadata === 'string') {
      try { existingMetadata = JSON.parse(existingMetadata); } catch (e) { existingMetadata = {}; }
    }
    const newMetadata = contact.metadata || {};
    const mergedMetadata = { ...existingMetadata, ...newMetadata };

    // Update the contact
    await query(`
      UPDATE contacts SET
name = $1, email = $2, phone = $3, department = $4, major = $5, notes = $6,
  file_status = $7, agent_assigned = $8, checklist = $9, activity_log = $10,
  recorded_sessions = $11, documents = $12, visa_information = $13, lms_progress = $14,
  lms_notes = $15, gpa = $16, advisor = $17, courses = $18, street1 = $19, street2 = $20,
  city = $21, state = $22, zip = $23, country = $24, gstin = $25, pan = $26, tags = $27,
  visa_type = $28, degree = $32, country_of_application = $29, source = $30, contact_type = $31,
      stream = $33, intake = $34, counselor_assigned = $35, counselor_assigned_2 = $36, application_email = $37,
      application_password = $38, metadata = $39
      WHERE id = $40
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
      contact.degree,
      contact.stream,
      contact.intake,
      contact.counselorAssigned,
      contact.counselorAssigned2,
      contact.applicationEmail,
      contact.applicationPassword,
      JSON.stringify(mergedMetadata),
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
    const updatedContact = transformContact(result.rows[0]);

    // --- UNIVERSITY APPLICATION AUTOMATION TRIGGERS ---
    try {
      const oldApps = oldContact.visaInformation?.universityApplication?.universities || [];
      const newApps = updatedContact.visaInformation?.universityApplication?.universities || [];

      // Check each application for status changes
      newApps.forEach((newApp, i) => {
        const oldApp = oldApps[i];
        if (oldApp && oldApp.status !== newApp.status) {
          console.log(`🤖 [Automation] Detected status change for ${updatedContact.name}: ${oldApp.status} -> ${newApp.status}`);

          // Map status to Trigger Event
          let trigger = null;
          switch (newApp.status) {
            case 'Applied': trigger = 'Application Marked Applied'; break;
            case 'In Review': trigger = 'Application Review Started'; break;
            case 'On Hold': trigger = 'Application Marked On Hold'; break;
            case 'Offer Received':
            case 'Received Acceptance': trigger = 'Application Acceptance Received'; break;
            case 'Received I20': trigger = 'Application I20 Received'; break;
            case 'Rejected': trigger = 'Application Rejected'; break;
            case 'Application Deferred': trigger = 'Application Deferred'; break;
          }

          if (trigger) {
            evaluateAutomation(trigger, {
              ...updatedContact,
              ...newApp,
              contact_name: updatedContact.name,
              contact_email: updatedContact.email,
              contact_phone: updatedContact.phone,
              university_name: newApp.universityName,
              course_name: newApp.course, // Kept for backwards compatibility
              program: newApp.course,
              ack_number: newApp.ackNumber,
              intake: newApp.intake,
              application_submission_date: newApp.applicationSubmissionDate,
              student_portal_remark: newApp.studentPortalRemark,
              application_status: newApp.status,
              old_status: oldApp.status,
              new_status: newApp.status
            });
          }
        }
      });
    } catch (autoErr) {
      console.error('❌ [Automation] Error triggering university events:', autoErr);
    }

    res.json(updatedContact);
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
      user_id: primary.user_id || target.user_id,

      // Merge metadata (Accounts Receivable, etc.)
      metadata: {
        ...(typeof target.metadata === 'string' ? JSON.parse(target.metadata || '{}') : (target.metadata || {})),
        ...(typeof primary.metadata === 'string' ? JSON.parse(primary.metadata || '{}') : (primary.metadata || {}))
      }
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
        application_password = $37, avatar_url = $38, user_id = $39, metadata = $41
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
      mergedData.avatar_url, mergedData.user_id, primaryId, JSON.stringify(mergedData.metadata)
    ].map(val => val === undefined ? null : val));

    // Update all related records to point to primary contact
    const recordsUpdated = {};

    // ✅ Update visitors (by contact_id FK)
    const visitorsResult = await query('UPDATE visitors SET contact_id = $1 WHERE contact_id = $2 RETURNING id', [primaryId, targetContactId]);
    recordsUpdated.visitors = visitorsResult.rows.length;

    // ✅ Update financial transactions (by contact_id FK)
    const transactionsResult = await query('UPDATE transactions SET contact_id = $1 WHERE contact_id = $2 RETURNING id', [primaryId, targetContactId]);
    recordsUpdated.transactions = transactionsResult.rows.length;

    // ✅ Update visa operations (by contact_id FK)
    const visaOpsResult = await query('UPDATE visa_operations SET contact_id = $1 WHERE contact_id = $2 RETURNING id', [primaryId, targetContactId]);
    recordsUpdated.visaOps = visaOpsResult.rows.length;

    // ✅ Update tasks (by contact_id FK)
    const tasksResult = await query('UPDATE tasks SET contact_id = $1 WHERE contact_id = $2 RETURNING id', [primaryId, targetContactId]);
    recordsUpdated.tasks = tasksResult.rows.length;

    // ✅ Update recurring tasks (by contact_id FK)
    const recurringTasksResult = await query('UPDATE recurring_tasks SET contact_id = $1 WHERE contact_id = $2 RETURNING task_id', [primaryId, targetContactId]);
    recordsUpdated.recurringTasks = recurringTasksResult.rows.length;

    // ✅ Update support tickets (by contact_id FK)
    const ticketsResult = await query('UPDATE tickets SET contact_id = $1 WHERE contact_id = $2 RETURNING ticket_id', [primaryId, targetContactId]);
    recordsUpdated.tickets = ticketsResult.rows.length;

    // ✅ Update CRM leads — leads use text name + email/phone (no FK)
    // Match by ANY identifier from the target contact to catch all associated leads
    const leadsResult = await query(`
      UPDATE leads 
      SET contact = $1, email = COALESCE(email, $4), phone = COALESCE(phone, $5)
      WHERE contact = $2 OR email = $3 OR phone = $5
      RETURNING id
    `, [mergedData.name, target.name, target.email, mergedData.email, target.phone]);
    recordsUpdated.leads = leadsResult.rows.length;

    // ✅ Update website visits (by user_id if target contact had a user)
    if (target.user_id) {
      const websiteVisitsResult = await query(
        'UPDATE website_visits SET user_id = $1 WHERE user_id = $2 RETURNING id',
        [mergedData.user_id || primary.user_id, target.user_id]
      );
      recordsUpdated.websiteVisits = websiteVisitsResult.rows.length;
    }

    // ✅ If target had a user link, update user name to match merged contact
    if (target.user_id && !primary.user_id) {
      await query('UPDATE users SET name = $1 WHERE id = $2', [mergedData.name, target.user_id]);
      console.log(`✅ Updated user ${target.user_id} to link with primary contact`);
    }

    // Delete target contact
    await query('DELETE FROM contacts WHERE id = $1', [targetContactId]);

    console.log(`✅ Merge complete: ${recordsUpdated.visitors} visitors, ${recordsUpdated.transactions} transactions, ${recordsUpdated.leads} leads (w/ quotations), ${recordsUpdated.visaOps} visa ops, ${recordsUpdated.tasks} tasks, ${recordsUpdated.recurringTasks} recurring tasks, ${recordsUpdated.tickets} tickets, ${recordsUpdated.websiteVisits || 0} website visits migrated`);

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
    createdAt: createdAt || lead.created_at,
    enteredNewAt: lead.entered_new_at,
    enteredQualifiedAt: lead.entered_qualified_at,
    enteredProposalAt: lead.entered_proposal_at,
    enteredWonAt: lead.entered_won_at,
    currentStageEnteredAt: lead.current_stage_entered_at
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

// Update Document Category/Privacy
router.put('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, is_private } = req.body;

    // Check if document exists and get current info
    const docCheck = await query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docCheck.rows[0];

    // Access control: only Staff/Admin can move documents or change privacy
    if (req.user.role !== 'Admin' && req.user.role !== 'Staff') {
      return res.status(403).json({ error: 'Unauthorized to update document' });
    }

    // Update the document
    // We only update fields that are provided
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (category !== undefined) {
      updateFields.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    if (is_private !== undefined) {
      updateFields.push(`is_private = $${paramCount}`);
      values.push(is_private);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.json({ message: 'No changes provided' });
    }

    values.push(id);
    const sql = `UPDATE documents SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating document:', error);
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

    if (item.item_type === 'document' || item.item_type === 'dependency_document') {
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
        visaInterviewData: row.visa_interview_data,
        dsData: Array.isArray(row.ds_data) ? row.ds_data : {
          ...row.ds_data,
          confirmationDocumentId: row.confirmation_document_id || row.ds_data?.confirmationDocumentId,
          confirmationDocumentName: row.confirmation_document_name || row.ds_data?.confirmationDocumentName,
          fillingDocuments: row.filling_documents?.length ? row.filling_documents : (row.ds_data?.fillingDocuments || []),
          studentStatus: row.student_status || row.ds_data?.studentStatus || 'pending',
          adminStatus: row.admin_status || row.ds_data?.adminStatus || 'pending',
          rejectionReason: row.rejection_reason || row.ds_data?.rejectionReason,
          adminName: row.admin_name || row.ds_data?.adminName
        },
        showCgiOnPortal: row.show_cgi_on_portal,
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

    // AUTOMATION Payload Helper
    const automationPayload = {
      ...slotResponse,
      contact_id: opData.contact_id,
      vop_number: opData.vop_number,
      visa_status: opData.status,
      appointment_state: finalSlotBookingData?.appointmentState || opData.slot_booking_data?.appointmentState,
      ds160_number: opData.ds_data?.confirmationNumber,
      ds160_start_date: opData.ds_data?.startDate,
      ds160_expiry_date: opData.ds_data?.expiryDate,
      ds160_status: opData.ds_data?.status
    };

    // Slot Booked Trigger
    if (slotBookingData && slotBookingData.appointmentState && slotBookingData.appointmentState !== currentSlotData.appointmentState) {
      evaluateAutomation('Slot Booked', automationPayload);
    }

    // AUTOMATION TRIGGERS for Visa Outcome
    if (visaInterviewData && visaInterviewData.visaOutcome) {
      const outcome = visaInterviewData.visaOutcome.toLowerCase();
      let triggerEvent = null;
      if (outcome === 'approved') triggerEvent = 'Visa Approved';
      else if (outcome === 'rejected') triggerEvent = 'Visa Rejected';
      else if (outcome === '221g') triggerEvent = 'Visa 221g (Administrative Processing)';

      if (triggerEvent) {
        evaluateAutomation(triggerEvent, {
          ...automationPayload,
          outcome: visaInterviewData.visaOutcome
        });
      }
    }

    res.json(slotResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visa-operations/:id/ds-160', authenticateToken, async (req, res) => {
  try {
    const { dsData } = req.body;

    // Fetch existing data first to merge
    const currentOp = await query('SELECT ds_data FROM visa_operations WHERE id = $1', [req.params.id]);

    if (currentOp.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const existingDsData = currentOp.rows[0].ds_data || {};
    let mergedDsData;
    
    if (Array.isArray(dsData)) {
        // If dsData is an array, it's the new Multi-Group format
        mergedDsData = dsData;
    } else if (dsData && dsData.dsGroups) {
        // Handle case where it might be wrapped in an object with dsGroups key
        mergedDsData = dsData.dsGroups;
    } else {
        // Legacy single object merge
        mergedDsData = { ...(typeof existingDsData === 'object' && !Array.isArray(existingDsData) ? existingDsData : {}), ...dsData };
    }

    // Update both JSON and dedicated columns
    const result = await query(`
      UPDATE visa_operations
      SET ds_data = $1,
          student_status = COALESCE($3, student_status),
          admin_status = COALESCE($4, admin_status),
          rejection_reason = COALESCE($5, rejection_reason),
          admin_name = COALESCE($6, admin_name)
      WHERE id = $2
      RETURNING *
    `, [
      JSON.stringify(mergedDsData),
      req.params.id,
      dsData?.studentStatus,
      dsData?.adminStatus,
      dsData?.rejectionReason,
      dsData?.adminName
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const op = result.rows[0];
    const dsResponse = {
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
    };

    // DS-160 Submitted Trigger
    if (dsData.confirmationNumber && (!existingDsData.confirmationNumber || dsData.confirmationNumber !== existingDsData.confirmationNumber)) {
      evaluateAutomation('DS-160 Submitted', {
        ...dsResponse,
        contact_id: op.contact_id,
        vop_number: op.vop_number,
        visa_status: op.status,
        ds160_number: dsData.confirmationNumber,
        ds160_start_date: dsData.startDate,
        ds160_expiry_date: dsData.expiryDate,
        ds160_status: dsData.status,
        appointment_state: op.slot_booking_data?.appointmentState
      });
    }

    res.json(dsResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visa-operations/:id/ds-160/document', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type, groupIndex, flowIndex } = req.body;
    const gIdx = groupIndex !== undefined ? parseInt(groupIndex) : 0;
    const fIdx = flowIndex !== undefined ? parseInt(flowIndex) : 0;
    const uploadType = type || req.query.type || 'internal';
    const isPrivate = uploadType === 'internal';

    const opResult = await query('SELECT contact_id, ds_data FROM visa_operations WHERE id = $1', [req.params.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    let dsData = opResult.rows[0].ds_data;
    const contactId = opResult.rows[0].contact_id;

    // Normalization
    if (!Array.isArray(dsData)) {
      const legacyMain = { ...dsData };
      const legacyDeps = legacyMain.dependencies || [];
      delete legacyMain.dependencies;
      dsData = [{ main: legacyMain, dependencies: legacyDeps }];
    }

    if (!dsData[gIdx]) {
      return res.status(400).json({ error: `Group ${gIdx} not found` });
    }

    // Create entry in visa_operation_items
    const itemResult = await query(`
      INSERT INTO visa_operation_items (operation_id, item_type, name, content_type, file_data)
      VALUES ($1, 'document', $2, $3, $4)
      RETURNING id
    `, [req.params.id, req.file.originalname, req.file.mimetype, req.file.buffer]);

    const itemId = itemResult.rows[0].id;

    // Also insert into documents table
    if (contactId) {
      await query(`
        INSERT INTO documents (contact_id, name, type, size, content, is_private, category)
        VALUES ($1, $2, $3, $4, $5, $6, 'DS-160')
      `, [contactId, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer, isPrivate]);
    }

    // Update dsData
    const group = { ...dsData[gIdx] };
    let flow;
    if (fIdx === 0) {
      flow = group.main = { ...group.main };
    } else {
      if (!group.dependencies) group.dependencies = [];
      while (group.dependencies.length < fIdx) group.dependencies.push({});
      flow = group.dependencies[fIdx - 1] = { ...group.dependencies[fIdx - 1] };
    }

    if (uploadType === 'filling') {
      if (!flow.fillingDocuments) flow.fillingDocuments = [];
      flow.fillingDocuments.push({ id: itemId, name: req.file.originalname });
      flow.studentStatus = 'pending';
      flow.adminStatus = 'pending';
    } else if (uploadType === 'confirmation') {
      flow.confirmationDocumentId = itemId;
      flow.confirmationDocumentName = req.file.originalname;
    } else {
      if (!flow.internalDocuments) flow.internalDocuments = [];
      flow.internalDocuments.push({ id: itemId, name: req.file.originalname });
      flow.documentId = itemId;
      flow.documentName = req.file.originalname;
    }

    dsData[gIdx] = group;

    const result = await query(`
      UPDATE visa_operations
      SET ds_data = $1
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(dsData), req.params.id]);

    const op = result.rows[0];
    const finalResponse = {
      ...op,
      dsData: op.ds_data,
      vopNumber: op.vop_number,
      contactId: op.contact_id
    };

    // Automation Triggers (simplified for brevity, mirroring original logic)
    if (uploadType === 'confirmation') evaluateAutomation('Visa Confirmation Document Uploaded', { ...finalResponse, document_name: req.file.originalname });
    if (uploadType === 'filling') {
      evaluateAutomation('DS-160 Waiting for Student Approval', finalResponse);
      evaluateAutomation('DS-160 Waiting for Admin Approval', finalResponse);
    }

    res.json(finalResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/visa-operations/:id/ds-160/document/:itemId', authenticateToken, async (req, res) => {
  try {
    const opResult = await query('SELECT ds_data FROM visa_operations WHERE id = $1', [req.params.id]);
    if (opResult.rows.length === 0) return res.status(404).json({ error: 'Operation not found' });

    let dsData = opResult.rows[0].ds_data;
    const itemId = parseInt(req.params.itemId);

    if (Array.isArray(dsData)) {
      dsData = dsData.map(group => {
        const newGroup = { ...group };
        const flows = [newGroup.main, ...(newGroup.dependencies || [])];
        flows.forEach(flow => {
          if (!flow) return;
          if (flow.documentId === itemId) { delete flow.documentId; delete flow.documentName; }
          if (flow.confirmationDocumentId === itemId) { delete flow.confirmationDocumentId; delete flow.confirmationDocumentName; }
          if (flow.fillingDocuments) flow.fillingDocuments = flow.fillingDocuments.filter(d => d.id !== itemId);
          if (flow.internalDocuments) flow.internalDocuments = flow.internalDocuments.filter(d => d.id !== itemId);
        });
        return newGroup;
      });
    } else {
      // Legacy single object handling (optional but good)
      const flow = dsData;
      if (flow.documentId === itemId) { delete flow.documentId; delete flow.documentName; }
      if (flow.confirmationDocumentId === itemId) { delete flow.confirmationDocumentId; delete flow.confirmationDocumentName; }
      if (flow.fillingDocuments) flow.fillingDocuments = flow.fillingDocuments.filter(d => d.id !== itemId);
      if (flow.internalDocuments) flow.internalDocuments = flow.internalDocuments.filter(d => d.id !== itemId);
    }

    const result = await query('UPDATE visa_operations SET ds_data = $1 WHERE id = $2 RETURNING *', [JSON.stringify(dsData), req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deprecate /dependency/document in favor of single /document route with flowIndex, 
// keeping it for compatibility by mapping to the new logic
router.post('/visa-operations/:id/ds-160/dependency/document', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Map 'index' (0-based for deps) to 'flowIndex' (1-based for the new unified route)
    const { index } = req.body;
    const flowIndex = index !== undefined ? parseInt(index) + 1 : 1;
    
    // Construct a new request body for internal redirection or just call the logic
    // For simplicity, we'll just redirect the parameters to a shared function
    // But since this is a route, we'll just re-implement the call slightly
    req.body.flowIndex = flowIndex;
    // We already have the logic in the /document route, better to just call it if possible
    // or just copy the essential part.
    res.status(400).json({ error: 'Please use /visa-operations/:id/ds-160/document with groupIndex and flowIndex instead.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visa-operations/:id/ds-160/status', authenticateToken, async (req, res) => {
  try {
    const { studentStatus, adminStatus, rejectionReason, groupIndex, flowIndex } = req.body;
    const gIdx = groupIndex !== undefined ? parseInt(groupIndex) : 0;
    const fIdx = flowIndex !== undefined ? parseInt(flowIndex) : 0;

    const opResult = await query('SELECT ds_data, contact_id, vop_number, status, slot_booking_data FROM visa_operations WHERE id = $1', [req.params.id]);
    if (opResult.rows.length === 0) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    let dsData = opResult.rows[0].ds_data;
    const op_data = opResult.rows[0];

    // Migration / Normalization: Ensure ds_data is an array of groups
    if (!Array.isArray(dsData)) {
      // Migrate legacy object to first group
      const legacyMain = { ...dsData };
      const legacyDeps = legacyMain.dependencies || [];
      delete legacyMain.dependencies;
      dsData = [{ main: legacyMain, dependencies: legacyDeps }];
    }

    if (!dsData[gIdx]) {
      return res.status(400).json({ error: `Group ${gIdx} not found` });
    }

    const group = { ...dsData[gIdx] };
    let target;

    if (fIdx === 0) {
      // Update MAIN flow of group
      group.main = {
        ...group.main,
        ...(studentStatus && { studentStatus }),
        ...(adminStatus && { adminStatus }),
        ...(rejectionReason && { rejectionReason }),
        ...(adminStatus === 'accepted' && { adminName: req.user.name })
      };
      target = group.main;
    } else {
      // Update DEPENDENCY flow of group
      if (!group.dependencies || !group.dependencies[fIdx - 1]) {
        return res.status(400).json({ error: `Flow ${fIdx} not found in group ${gIdx}` });
      }
      group.dependencies = [...group.dependencies];
      const dep = { ...group.dependencies[fIdx - 1] };
      if (studentStatus) dep.studentStatus = studentStatus;
      if (adminStatus) dep.adminStatus = adminStatus;
      if (rejectionReason) dep.rejectionReason = rejectionReason;
      if (adminStatus === 'accepted') dep.adminName = req.user.name;
      group.dependencies[fIdx - 1] = dep;
      target = dep;
    }

    dsData[gIdx] = group;

    // Update query - we still update the dedicated columns if it's Group 0 Flow 0
    let updateQuery, updateParams;
    if (gIdx === 0 && fIdx === 0) {
      updateQuery = `
        UPDATE visa_operations
        SET ds_data = $1,
            student_status = COALESCE($3, student_status),
            admin_status = COALESCE($4, admin_status),
            rejection_reason = COALESCE($5, rejection_reason),
            admin_name = COALESCE($6, admin_name)
        WHERE id = $2
        RETURNING *
      `;
      updateParams = [
        JSON.stringify(dsData),
        req.params.id,
        studentStatus,
        adminStatus,
        rejectionReason,
        adminStatus === 'accepted' ? req.user.name : null
      ];
    } else {
      updateQuery = `UPDATE visa_operations SET ds_data = $1 WHERE id = $2 RETURNING *`;
      updateParams = [JSON.stringify(dsData), req.params.id];
    }

    const result = await query(updateQuery, updateParams);
    const op = result.rows[0];

    const finalResponse = {
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
    };

    const automationPayload = {
      ...finalResponse,
      contact_id: op.contact_id,
      vop_number: op.vop_number,
      visa_status: op.status,
      ds160_number: target.confirmationNumber,
      ds160_status: target.studentStatus === 'accepted' && target.adminStatus === 'accepted' ? 'Approved' : 'Pending',
      appointment_state: op.slot_booking_data?.appointmentState
    };

    // Approval Triggers
    if (studentStatus === 'accepted') {
      evaluateAutomation('DS-160 Student Approved', automationPayload);
    } else if (studentStatus === 'pending') {
      evaluateAutomation('DS-160 Waiting for Student Approval', automationPayload);
    }

    if (adminStatus === 'accepted') {
      evaluateAutomation('DS-160 Admin Approved', automationPayload);
    } else if (adminStatus === 'pending') {
      evaluateAutomation('DS-160 Waiting for Admin Approval', automationPayload);
    }

    // Notification Logic: If student approves, notify Admin
    if (studentStatus === 'accepted') {
      try {
        const contactResult = await query('SELECT name FROM contacts WHERE id = $1', [op.contact_id]);
        const clientName = contactResult.rows.length > 0 ? contactResult.rows[0].name : 'Unknown Client';
        const groupLabel = gIdx > 0 ? ` Group #${gIdx + 1}` : '';
        const flowLabel = fIdx === 0 ? 'Main Applicant' : `Dependency #${fIdx}`;

        await query(`
          INSERT INTO notifications(title, description, read, link_to, recipient_roles)
          VALUES($1, $2, $3, $4, $5)
        `, [
          `DS-160 Approved by Student (${flowLabel}${groupLabel})`,
          `Client ${clientName} has approved the DS-160 (${flowLabel}${groupLabel}), waiting for admin approval.`,
          0,
          JSON.stringify({ type: 'visa_operation', id: req.params.id }),
          JSON.stringify(['Admin'])
        ]);
      } catch (notifyError) {
        console.error('Failed to create notification:', notifyError);
      }
    }

    res.json(finalResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visa-operations', authenticateToken, async (req, res) => {
  try {
    const { contactId, name, phone, country } = req.body;

    // Generate VOP-XXXXX number
    // Generate VOP-XXXXX number with retry logic
    let vopNumber;
    let retries = 0;
    const maxRetries = 5;
    let newOp;

    while (retries < maxRetries) {
      // Find the highest existing number across both formats (VOP-XXXXX and VOP - XXXXX)
      const lastOpResult = await query(
        `SELECT vop_number FROM visa_operations 
         WHERE vop_number ~ '^VOP\s*-\s*[0-9]+$' 
         ORDER BY CAST(SUBSTRING(vop_number FROM '[0-9]+') AS INTEGER) DESC 
         LIMIT 1`
      );

      let nextNumber = 1;
      if (lastOpResult.rows.length > 0) {
        const lastVop = lastOpResult.rows[0].vop_number;
        // Extract number ignoring spaces
        const match = lastVop.match(/(\d+)/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }

      // Add retry offset if we're retrying
      nextNumber += retries;

      // Format: VOP-XXXXX (Standardized without spaces)
      vopNumber = `VOP-${String(nextNumber).padStart(5, '0')}`;

      try {
        const result = await query(`
          INSERT INTO visa_operations(vop_number, contact_id, name, phone, country, user_id)
          VALUES($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [vopNumber, contactId, name, phone, country, req.user.id]);

        newOp = result.rows[0];
        break; // Success!
      } catch (err) {
        if (err.code === '23505' && err.constraint === 'visa_operations_vop_number_key') {
          console.warn(`Collision for ${vopNumber}, retrying...`);
          retries++;
        } else {
          throw err; // Other error
        }
      }
    }

    if (!newOp) {
      throw new Error('Failed to generate unique VOP number after retries');
    }

    // AUTOMATION HOOK
    evaluateAutomation('Visa Operation Created', {
      ...newOp,
      vop_number: newOp.vop_number,
      contact_name: newOp.name,
      country: newOp.country,
      visa_status: newOp.admin_status || newOp.student_status
    });

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

router.delete('/visa-operations/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const operationId = parseInt(req.params.id);
    const result = await query('DELETE FROM visa_operations WHERE id = $1 RETURNING id', [operationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visa operation not found' });
    }

    res.json({ success: true, message: 'Visa operation deleted successfully' });
  } catch (error) {
    console.error('Error deleting visa operation:', error);
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
      console.log(`📝 Auto - creating contact for manual lead: ${lead.contact} `);

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
        const lastSeq = parseInt(lastId.trim().slice(-3));
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
      }

      const generatedContactId = `${datePrefix}${String(sequence).padStart(3, '0')} `;

      await query(`
        INSERT INTO contacts(name, email, phone, contact_id, source, department, notes, checklist, activity_log, recorded_sessions)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          details: `Connected to new lead: ${lead.title} `
        }
      ];

      await query('UPDATE contacts SET activity_log = $1 WHERE id = $2', [JSON.stringify(updatedLog), matched.id]);
    }

    // 1. Create the Lead
    const leadResult = await query(`
      INSERT INTO leads(title, company, value, contact, stage, email, phone, source, assigned_to, notes, quotations, 
                        entered_new_at, entered_qualified_at, entered_proposal_at, entered_won_at, current_stage_entered_at)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
           CASE WHEN $5 = 'New' THEN CURRENT_TIMESTAMP ELSE NULL END,
           CASE WHEN $5 = 'Qualified' THEN CURRENT_TIMESTAMP ELSE NULL END,
           CASE WHEN $5 = 'Proposal' THEN CURRENT_TIMESTAMP ELSE NULL END,
           CASE WHEN $5 = 'Won' THEN CURRENT_TIMESTAMP ELSE NULL END,
           CURRENT_TIMESTAMP)
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

    // AUTOMATION HOOK
    const transformedLead = transformLead(newLead);
    evaluateAutomation('Lead Created', {
      ...transformedLead,
      contact_name: transformedLead.contact || 'Customer',
      first_name: (transformedLead.contact || 'Customer').split(' ')[0],
      contact_email: transformedLead.email,
      contact_phone: transformedLead.phone,
      company_name: transformedLead.company,
      lead_source: transformedLead.source,
      lead_stage: transformedLead.stage
    });

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
      console.log(`📝 Auto - creating individual contact: ${enquiry.name} (${enquiry.phone})`);

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
        const lastSeq = parseInt(lastId.trim().slice(-3));
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
      }

      const generatedContactId = `${datePrefix}${String(sequence).padStart(3, '0')} `;

      await query(`
        INSERT INTO contacts(name, email, phone, contact_id, source, department, notes, checklist, activity_log, recorded_sessions)
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        generatedContactId,
        enquiry.source || 'Website',
        'Unassigned',
        `Interest: ${enquiry.interest}.Country: ${enquiry.country}.Message: ${enquiry.message} `,
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
          details: `New enquiry from ${enquiry.source || 'Website'}.Interest: ${enquiry.interest}.`
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
      `${enquiry.source || 'Website'} Enquiry: ${enquiry.name} `, // Title
      'Individual',                                             // Company
      0,                                                        // Value
      contactName,                                              // Contact Name
      'New',                                                    // Stage
      enquiry.email,                                            // Email
      enquiry.phone,                                            // Phone
      enquiry.source || 'Website',                             // Source
      null,                                                     // Assigned To
      `Interest: ${enquiry.interest}.Country: ${enquiry.country}.Message: ${enquiry.message} `, // Notes
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
  email = $6, phone = $7, source = $8, assigned_to = $9, notes = $10, quotations = $11,
  current_stage_entered_at = CASE WHEN stage != $5 THEN CURRENT_TIMESTAMP ELSE current_stage_entered_at END,
  entered_new_at = CASE WHEN stage != $5 AND $5 = 'New' THEN CURRENT_TIMESTAMP ELSE entered_new_at END,
  entered_qualified_at = CASE WHEN stage != $5 AND $5 = 'Qualified' THEN CURRENT_TIMESTAMP ELSE entered_qualified_at END,
  entered_proposal_at = CASE WHEN stage != $5 AND $5 = 'Proposal' THEN CURRENT_TIMESTAMP ELSE entered_proposal_at END,
  entered_won_at = CASE WHEN stage != $5 AND $5 = 'Won' THEN CURRENT_TIMESTAMP ELSE entered_won_at END
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

    // AUTOMATION HOOK
    if (lead.stage && lead.stage !== currentLead.stage) {
      const transformedLeadData = transformLead(updatedLead);
      const automationPayload = {
        ...transformedLeadData,
        contact_name: transformedLeadData.name,
        contact_email: transformedLeadData.email,
        contact_phone: transformedLeadData.phone,
        lead_stage: transformedLeadData.stage,
        old_stage: currentLead.stage,
        new_stage: lead.stage,
        current_stage_name: lead.stage,
        date_entered_current_stage: updatedLead.current_stage_entered_at ? new Date(updatedLead.current_stage_entered_at).toLocaleDateString() : 'N/A',
        date_entered_new_stage: updatedLead.entered_new_at ? new Date(updatedLead.entered_new_at).toLocaleDateString() : 'N/A',
        date_entered_qualified_stage: updatedLead.entered_qualified_at ? new Date(updatedLead.entered_qualified_at).toLocaleDateString() : 'N/A',
        date_entered_proposal_stage: updatedLead.entered_proposal_at ? new Date(updatedLead.entered_proposal_at).toLocaleDateString() : 'N/A',
        date_entered_won_stage: updatedLead.entered_won_at ? new Date(updatedLead.entered_won_at).toLocaleDateString() : 'N/A'
      };

      evaluateAutomation('Status Changed', automationPayload);

      // Stage Specific Triggers
      if (['New', 'Qualified', 'Proposal', 'Won'].includes(lead.stage)) {
        evaluateAutomation(`Stage Changed to ${lead.stage}`, automationPayload);
      }
    }

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
      SELECT q ->> 'id' as id 
      FROM leads l, jsonb_array_elements(l.quotations) q 
      WHERE q ->> 'id' LIKE 'QUO-%' 
      ORDER BY q ->> 'id' DESC 
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
      newId = `QUO-${String(sequence).padStart(7, '0')}`;
      // Collision check
      const check = await query(`
            SELECT 1 FROM leads l, jsonb_array_elements(l.quotations) q 
            WHERE q ->> 'id' = $1
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
      quotationNumber: newId,
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

// Helper: Deduct amount from Contact's Accounts Receivable (FIFO)
const deductFromAR = async (contactId, amount) => {
  if (!contactId || amount <= 0) return [];

  // Fetch contact metadata
  const contactRes = await query('SELECT metadata FROM contacts WHERE id = $1', [contactId]);
  if (contactRes.rows.length === 0) return [];

  const contact = contactRes.rows[0];
  let metadata = contact.metadata || {};
  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
  }

  if (!metadata.accountsReceivable || metadata.accountsReceivable.length === 0) return [];

  let amountToDeduct = parseFloat(amount);
  let arUpdated = false;

  // Process AR entries (FIFO)
  metadata.accountsReceivable = metadata.accountsReceivable.map(entry => {
    if (amountToDeduct <= 0 || entry.status === 'Paid') return entry;

    const remaining = parseFloat(entry.remainingAmount);
    if (remaining <= 0) return entry;

    let deduction = 0;
    if (remaining > amountToDeduct) {
      // Partial deduction of this entry
      deduction = amountToDeduct;
      entry.remainingAmount = remaining - deduction;
      entry.paidAmount = (entry.paidAmount || 0) + deduction;
      amountToDeduct = 0;
    } else {
      // Fully deduct this entry
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

    // Extract deductions for returning
    const deductions = metadata.accountsReceivable
      .filter(e => e._lastDeduction > 0)
      .map(e => ({ id: e.id, amount: e._lastDeduction }));

    // Cleanup temporary field
    metadata.accountsReceivable.forEach(e => delete e._lastDeduction);
    await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), contactId]);

    return deductions;
  }

  return [];
};

// Helper: Revert AR deductions (for Edit/Delete)
const revertARDeductions = async (contactId, arDeductions) => {
  if (!contactId || !arDeductions || arDeductions.length === 0) return;

  const contactRes = await query('SELECT metadata FROM contacts WHERE id = $1', [contactId]);
  if (contactRes.rows.length === 0) return;

  const contact = contactRes.rows[0];
  let metadata = contact.metadata || {};
  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
  }

  if (metadata.accountsReceivable) {
    let contactUpdated = false;
    arDeductions.forEach(deduction => {
      const entry = metadata.accountsReceivable.find(e => e.id === deduction.id);
      if (entry) {
        entry.remainingAmount = parseFloat(entry.remainingAmount) + parseFloat(deduction.amount);
        entry.paidAmount = Math.max(0, parseFloat(entry.paidAmount) - parseFloat(deduction.amount));
        if (entry.status === 'Paid' && entry.remainingAmount > 0) {
          entry.status = 'Pending';
          delete entry.paidAt;
        }
        contactUpdated = true;
      }
    });

    if (contactUpdated) {
      await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), contactId]);
      console.log(`✅ Reverted AR for Contact ${contactId}`);
    }
  }
};

// Transactions routes
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
    const transactions = result.rows.map(t => {
      const metadata = typeof t.metadata === 'string' ? JSON.parse(t.metadata) : (t.metadata || {});
      return {
        ...t,
        contactId: t.contact_id,
        customerName: t.customer_name, // Map snake_case to camelCase
        paymentMethod: t.payment_method,
        dueDate: t.due_date,
        additionalDiscount: t.additional_discount,
        metadata: metadata,
        linkedArId: t.linked_ar_id || metadata.linkedArId || null,
        amount: Number(t.amount),
        lineItems: t.line_items // Map snake_case to camelCase
      };
    });
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
      INSERT INTO vendors(name, email, phone, gstin, address)
VALUES($1, $2, $3, $4, $5)
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
      INSERT INTO products(name, description, price, type)
VALUES($1, $2, $3, $4)
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
      INSERT INTO expense_payees(name, default_category)
VALUES($1, $2)
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
      const maxSeqResult = await query("SELECT id FROM transactions WHERE id LIKE $1 ORDER BY id DESC LIMIT 1", [`${prefix}%`]);
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

    let metadata = transaction.metadata || {};
    if (typeof metadata === 'string') {
      try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
    }

    // Explicitly preserve linked fields from request body into metadata if not already there
    if (transaction.linkedArId) metadata.linkedArId = transaction.linkedArId;
    if (transaction.linkedLeadId) metadata.linkedLeadId = transaction.linkedLeadId;
    if (transaction.linkedQuotationId) metadata.linkedQuotationId = transaction.linkedQuotationId;
    if (transaction.linkedArId) metadata.linkedArId = transaction.linkedArId;

    const result = await query(`
      INSERT INTO transactions(id, contact_id, customer_name, date, description, type, status, amount, payment_method, due_date, additional_discount, metadata, line_items)
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      JSON.stringify(metadata),
      JSON.stringify(transaction.lineItems || [])
    ]);
    const newTransaction = result.rows[0];

    // AUTOMATION HOOK
    evaluateAutomation('Transaction Created', {
      ...newTransaction,
      transaction_id: newTransaction.id,
      amount: newTransaction.amount,
      status: newTransaction.status,
      date: newTransaction.date
    });

    if (newTransaction.status === 'Paid') {
      evaluateAutomation('Payment Received', {
        ...newTransaction,
        transaction_id: newTransaction.id,
        amount: newTransaction.amount,
        status: newTransaction.status,
        date: newTransaction.date
      });
    }

    // Automatic AR Deduction for Invoices (and Income if linked to contact)
    // DISABLED: Frontend app.tsx handles precise line-item AR allocation now.
    /*
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
          if (metadata && typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
          } else if (!metadata) {
            metadata = {};
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
              let currentTxMetadata = newTransaction.metadata || {};
              if (typeof currentTxMetadata === 'string') {
                try { currentTxMetadata = JSON.parse(currentTxMetadata); } catch (e) { currentTxMetadata = {}; }
              }
              await query('UPDATE transactions SET metadata = $1 WHERE id = $2', [
                JSON.stringify({ ...currentTxMetadata, arDeductions }),
                newTransaction.id
              ]);
            }

            // Cleanup temporary tracking field
            metadata.accountsReceivable.forEach(e => delete e._lastDeduction);
            await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(metadata), contactId]);

            console.log(`✅ Updated AR for Contact ${contactId} based on Invoice ${newTransaction.id} `);
          }
        }
      } catch (arError) {
        console.error('Failed to update Accounts Receivable:', arError);
        // Do not fail the transaction creation itself
      }
    }
    */

    res.json({
      ...newTransaction,
      contactId: newTransaction.contact_id,
      customerName: newTransaction.customer_name,
      paymentMethod: newTransaction.payment_method,
      dueDate: newTransaction.due_date,
      additionalDiscount: newTransaction.additional_discount,
      amount: Number(newTransaction.amount), // Ensure number
      lineItems: newTransaction.line_items // Return line items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id ? req.params.id.trim() : '';
    const transaction = req.body;

    // 1. Fetch existing transaction to revert previous AR effects
    const existingRes = await query('SELECT * FROM transactions WHERE TRIM(id) = $1', [transactionId]);
    if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });

    const existingTx = existingRes.rows[0];
    const existingMetadata = typeof existingTx.metadata === 'string' ? JSON.parse(existingTx.metadata) : (existingTx.metadata || {});
    const arDeductions = existingMetadata.arDeductions || [];
    const contactId = existingTx.contact_id;

    // Revert previous deductions if any
    // DISABLED: Handled by frontend
    /*
    if (arDeductions.length > 0 && contactId) {
      await revertARDeductions(contactId, arDeductions);
    }
    */

    // 2. Update Transaction
    // Ensure we keep existing metadata but clear old arDeductions until re-applied
    const newMetadata = { ...existingMetadata };
    delete newMetadata.arDeductions;

    // Allow updating metadata from request but don't overwrite blindly if not provided
    let requestMetadata = transaction.metadata || {};
    if (typeof requestMetadata === 'string') {
      try { requestMetadata = JSON.parse(requestMetadata); } catch (e) { requestMetadata = {}; }
    }

    // Explicitly preserve linked fields from request body into metadata if not already there
    if (transaction.linkedArId) requestMetadata.linkedArId = transaction.linkedArId;
    if (transaction.linkedLeadId) requestMetadata.linkedLeadId = transaction.linkedLeadId;
    if (transaction.linkedQuotationId) requestMetadata.linkedQuotationId = transaction.linkedQuotationId;

    const mergedMetadata = { ...newMetadata, ...requestMetadata };

    await query(`
      UPDATE transactions SET
contact_id = $1, customer_name = $2, date = $3, description = $4, type = $5, status = $6, amount = $7, payment_method = $8, due_date = $9, additional_discount = $10, metadata = $11, line_items = $12
      WHERE TRIM(id) = $13
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
      JSON.stringify(mergedMetadata),
      JSON.stringify(transaction.lineItems || []),
      transactionId
    ]);

    // 3. Apply New AR Deductions (if Invoice/Income and linked to Contact)
    // DISABLED: Handled by precise line-item allocation on frontend
    /*
    let newArDeductions = [];
    const targetContactId = transaction.contactId || existingTx.contact_id; // Use new or fallback to old? Usually new.

    if ((transaction.type === 'Invoice' || transaction.type === 'Income') && targetContactId) {
      newArDeductions = await deductFromAR(targetContactId, transaction.amount);

      if (newArDeductions.length > 0) {
        // Update metadata with new deductions
        mergedMetadata.arDeductions = newArDeductions;
        await query('UPDATE transactions SET metadata = $1 WHERE TRIM(id) = $2', [
          JSON.stringify(mergedMetadata),
          transactionId
        ]);
      }
    }
    */

    const result = await query('SELECT * FROM transactions WHERE TRIM(id) = $1', [transactionId]);
    const updated = result.rows[0];
    if (!updated) throw new Error("Transaction could not be refreshed after update");

    // AUTOMATION HOOK
    if (updated.status === 'Paid' && existingTx.status !== 'Paid') {
      evaluateAutomation('Payment Received', updated);
    }
    res.json({
      ...updated,
      lineItems: updated.line_items,
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
    const transactionId = req.params.id ? req.params.id.trim() : '';

    // 1. Fetch transaction to check for AR deductions
    const txRes = await query('SELECT * FROM transactions WHERE TRIM(id) = $1', [transactionId]);
    if (txRes.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });

    const transaction = txRes.rows[0];
    const metadata = typeof transaction.metadata === 'string' ? JSON.parse(transaction.metadata) : (transaction.metadata || {});
    const arDeductions = metadata.arDeductions || [];
    const contactId = transaction.contact_id;

    // 2. Revert AR if deductions were tracked
    // DISABLED: Reversions are robustly managed in frontend via handleDeleteTransaction mapping
    /*
    if (arDeductions.length > 0 && contactId) {
      try {
        const contactRes = await query('SELECT metadata FROM contacts WHERE id = $1', [contactId]);
        if (contactRes.rows.length > 0) {
          const contact = contactRes.rows[0];
          let contactMetadata = contact.metadata || {};
          if (contactMetadata && typeof contactMetadata === 'string') {
            try { contactMetadata = JSON.parse(contactMetadata); } catch (e) { contactMetadata = {}; }
          } else if (!contactMetadata) {
            contactMetadata = {};
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
              console.log(`♻️ Reverted AR deductions for Contact ${contactId} after deleting Transaction ${transactionId} `);
            }
          }
        }
      } catch (revertError) {
        console.error('Failed to revert AR deductions:', revertError);
        // We continue with deletion even if reversion fails to avoid blocking the user
      }
    }
    */

    await query('DELETE FROM transactions WHERE TRIM(id) = $1', [transactionId]);
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
    taskId = `${prefix} -${String(nextNum).padStart(6, '0')} `;
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
      INSERT INTO task_time_logs(task_id, assigned_to)
VALUES($1, $2)
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
      SELECT DISTINCT ON(rt.id) rt.*,
  COALESCE(l.contact, c.name) as contact_name,
  COALESCE(l.phone, c.phone) as phone,
  COALESCE(l.email, c.email) as email
      FROM recurring_tasks rt
      LEFT JOIN leads l ON rt.lead_id = l.id
      LEFT JOIN contacts c ON rt.contact_id = c.id
      WHERE rt.is_active = true
AND(rt.lead_id IS NOT NULL OR rt.contact_id IS NOT NULL)
AND(rt.next_generation_at IS NULL OR rt.next_generation_at <= $1)
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

      console.log(`🤖 Generated recurring task instance ${taskId} for LT - ${rt.id}`);
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
      updateQuery += `, completed_by = $${params.length + 1}, completed_at = $${params.length + 2} `;
      params.push(completedBy, completedAt);
    }

    updateQuery += ` WHERE id = $${params.length + 1 - (completedBy ? 0 : 2)} `; // Adjust param index logic if needed, simpler to just overwrite params logic

    // Re-doing params construction for clarity
    const updateFields = [
      'title = $1', 'description = $2', 'due_date = $3', 'status = $4', 'assigned_to = $5', 'priority = $6', 'activity_type = $7', 'is_visible_to_student = $8'
    ];
    const updateParams = [
      task.title, task.description, task.dueDate, task.status, task.assignedTo, task.priority, task.activityType || null, task.isVisibleToStudent
    ];

    // Add replies if present
    if (task.replies !== undefined) {
      updateFields.push(`replies = $${updateParams.length + 1} `);
      updateParams.push(JSON.stringify(task.replies));
    }

    if (task.visibility_emails !== undefined) {
      updateFields.push(`visibility_emails = $${updateParams.length + 1} `);
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
        INSERT INTO task_time_logs(task_id, assigned_to)
VALUES($1, $2)
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
        INSERT INTO task_time_logs(task_id, assigned_to)
VALUES($1, $2)
  `, [req.params.id, newAssignee]);
    }

    // AUTOMATION HOOK
    if (newStatus === 'done' && previousStatus !== 'done') {
      evaluateAutomation('Task Completed', updated.rows[0]);
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
    res.setHeader('Content-Disposition', `${isPreview ? 'inline' : 'attachment'}; filename = "${filename}"`);

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
  contactEmail: ticket.contact_email,
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
  updatedAt: ticket.updated_at,
  solvedAt: ticket.solved_at
});

// Create ticket
router.post('/tickets', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    console.log("==== TICKET CREATION REQUEST BODY ====");
    console.log(req.body);
    const { contactId, subject, description, priority, category } = req.body;

    // Generate unique sequential ticket ID
    const seqResult = await client.query("SELECT nextval('ticket_seq')");
    const nextNum = seqResult.rows[0].nextval;
    const ticketId = `TKT-${String(nextNum).padStart(7, '0')}`;

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
      SELECT t.*, c.name as contact_name, c.email as contact_email, u1.name as assigned_to_name, u2.name as created_by_name,
  (SELECT json_agg(json_build_object('id', ta.id, 'name', ta.filename, 'size', ta.file_size))
         FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachments
      FROM tickets t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
  `, [newTicket.id]);

    const transformedTicket = transformTicket(finalResult.rows[0]);

    // Automation Trigger
    evaluateAutomation('Ticket Created', {
      ...transformedTicket,
      ticket_id: transformedTicket.ticketId || transformedTicket.id,
      contact_id: transformedTicket.contactId,
      contact_name: transformedTicket.contactName,
      contact_email: transformedTicket.contactEmail,
      email: transformedTicket.contactEmail, // Generic fallback
      staff_name: transformedTicket.assignedToName,
      status: transformedTicket.status,
      priority: transformedTicket.priority,
      subject: transformedTicket.subject
    });

    res.json(transformedTicket);
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
      WHERE ta.id = $1 AND(
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
`, [req.params.id, req.user.role, req.user.id, req.user.name]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'Unauthorized: You do not have access to this attachment.' });

    const attachment = result.rows[0];
    res.setHeader('Content-Type', attachment.content_type);
    res.setHeader('Content-Disposition', `inline; filename = "${attachment.filename}"`);
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
OR(t.assigned_to IS NULL AND(
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
      SET status = $1, priority = $2, assigned_to = $3, resolution_notes = $4, updated_at = CURRENT_TIMESTAMP, category = $9,
          solved_at = CASE WHEN $1 IN ('Resolved', 'Closed') THEN COALESCE(solved_at, CURRENT_TIMESTAMP) ELSE NULL END
      WHERE id = $5 AND EXISTS(
  SELECT 1 FROM tickets t2
        LEFT JOIN contacts c ON t2.contact_id = c.id
        WHERE t2.id = $5 AND(
    $6 = 'Admin' OR
    ($6 = 'Staff' AND(
      t2.assigned_to = $7 OR t2.created_by = $7 
            OR(t2.assigned_to IS NULL AND(
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
      SELECT t.*, c.name as contact_name, c.email as contact_email,
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

    const updatedTicket = transformTicket(finalResult.rows[0]);

    // Automation Triggers
    const automationPayload = {
      ...updatedTicket,
      ticket_id: updatedTicket.ticketId || updatedTicket.id,
      contact_id: updatedTicket.contactId,
      contact_name: updatedTicket.contactName,
      contact_email: updatedTicket.contactEmail,
      email: updatedTicket.contactEmail,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      staff_name: updatedTicket.assignedToName,
      subject: updatedTicket.subject,
      created_at: updatedTicket.createdAt ? new Date(updatedTicket.createdAt).toLocaleDateString() : 'N/A',
      solved_at: updatedTicket.solvedAt ? new Date(updatedTicket.solvedAt).toLocaleDateString() : 'N/A',
      client_name: updatedTicket.contactName || 'Client',
      client_email: updatedTicket.contactEmail || 'N/A'
    };

    // 1. General Update
    evaluateAutomation('Ticket Updated', automationPayload);

    // 2. State-Specific Triggers
    if (updatedTicket.status === 'Resolved') {
      evaluateAutomation('Ticket Resolved', automationPayload);
    } else if (updatedTicket.status === 'Closed') {
      evaluateAutomation('Ticket Closed', automationPayload);
    }

    res.json(updatedTicket);
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
      WHERE tm.ticket_id = $1 AND(
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
      INSERT INTO ticket_messages(ticket_id, sender_id, message)
VALUES($1, $2, $3)
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
      WHERE id = $1 AND(
    $2 = 'Admin' OR-- Typically only admins delete, but if staff can:
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
        WHERE members @> $1:: jsonb
  `, [JSON.stringify([parseInt(userId)])]);
      return res.json(result.rows);
    }

    // Normal behavior: only return channels where user is a member
    const result = await query(`
SELECT * FROM channels 
      WHERE members @> $1:: jsonb
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
      ON CONFLICT(id) DO UPDATE SET
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
      url: `/ channels / attachments / ${attachment.id} `
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
      'Content-Disposition': `inline; filename = "${filename}"`
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
    const newCourse = result.rows[0];

    // Automation Trigger
    evaluateAutomation('LMS Course Created', {
      ...newCourse,
      course_name: newCourse.title,
      course_price: newCourse.price
    });

    res.json(newCourse);
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
        transactionId = `INV - ${String(sequence).padStart(6, '0')} `;
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

    // 1. Check if contact exists by NAME (case-insensitive) AND PHONE number
    const contactCheck = await query('SELECT id FROM contacts WHERE LOWER(name) = LOWER($1) AND phone = $2', [visitor.name, visitor.company]);

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

    // Build payload for automation
    let clientEmail = null;
    if (contactId) {
      const contactResult = await query('SELECT email FROM contacts WHERE id = $1', [contactId]);
      if (contactResult.rows.length > 0) {
        clientEmail = contactResult.rows[0].email;
      }
    }

    const payload = {
      ...v,
      client_email: clientEmail || v.company,
      visitor_name: v.name,
      visitor_phone: v.company,
      staff_email: v.staff_email,
      staff_name: v.staff_name,
      contact: v.name,
      visit_purpose: v.purpose || '',
      visit_department: v.host || '',
      status: v.status,
      visit_number: v.daily_sequence_number
    };

    evaluateAutomation('Visit Created', payload);

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
    // Build payload for automation
    let clientEmail = null;
    if (v.contact_id) {
      const contactResult = await query('SELECT email FROM contacts WHERE id = $1', [v.contact_id]);
      if (contactResult.rows.length > 0) {
        clientEmail = contactResult.rows[0].email;
      }
    }

    const latestSegment = Array.isArray(v.visit_segments) && v.visit_segments.length > 0
      ? v.visit_segments[v.visit_segments.length - 1]
      : {};

    const payload = {
      ...v,
      client_email: clientEmail || v.company,
      visitor_name: v.name,
      visitor_phone: v.company,
      staff_email: v.staff_email,
      staff_name: v.staff_name,
      contact: v.name,
      visit_purpose: v.purpose || latestSegment.purpose,
      visit_action: latestSegment.action || '',
      visit_department: v.host || latestSegment.department || '',
      status: v.status,
      visit_number: v.daily_sequence_number
    };

    // Trigger automation
    evaluateAutomation('Visit Updated', payload);

    // Also fire 'Visit Checkout' if the visitor is being checked out
    const isCheckingOut = visitor.status === 'Checked Out' || visitor.checkOut;
    if (isCheckingOut) {
      const checkoutPayload = {
        ...payload,
        checkout_time: v.check_out || new Date().toISOString(),
        visit_duration_minutes: v.check_in && v.check_out
          ? Math.round((new Date(v.check_out) - new Date(v.check_in)) / 60000)
          : null
      };
      evaluateAutomation('Visit Checkout', checkoutPayload);
    }

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
  `, [` % ${search}% `]);
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
    res.json(result.rows.length > 0 ? result.rows[0].value : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MULTI-BRANCH GEOFENCING (Phase 6)
router.get('/attendance/branches', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM branches ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/attendance/branches', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, lat, lng, radius } = req.body;
    const result = await query(`
      INSERT INTO branches (name, lat, lng, radius)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO UPDATE SET lat = $2, lng = $3, radius = $4
      RETURNING *
    `, [name, lat, lng, radius || 50]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/attendance/branches/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    await query('DELETE FROM branches WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Settings
router.get('/settings/payment', authenticateToken, async (req, res) => {
  try {
    const upiResult = await query('SELECT value FROM system_settings WHERE key = $1', ['PAYMENT_UPI_ID']);
    const qrResult = await query('SELECT value FROM system_settings WHERE key = $1', ['PAYMENT_QR_CODE']);

    const upiData = upiResult.rows[0]?.value;
    const qrData = qrResult.rows[0]?.value;

    res.json({
      upiId: upiData ? (typeof upiData === 'object' ? upiData.upiId : upiData) : '',
      qrCode: qrData ? (typeof qrData === 'object' ? qrData.qrCode : qrData) : null
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

    const base64Data = `data:${req.file.mimetype}; base64, ${req.file.buffer.toString('base64')} `;

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
    console.log(`GET /settings/${req.params.key} - found:`, !!result.rows[0]);
    res.json(result.rows.length > 0 ? result.rows[0].value : null);
  } catch (error) {
    console.error(`GET /settings/${req.params.key} error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/:key', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { value } = req.body;
    console.log(`POST /settings/${req.params.key} - role: ${req.user.role}, value length: ${Array.isArray(value) ? value.length : 'N/A'}`);
    await query(`
      INSERT INTO system_settings(key, value)
VALUES($1, $2)
      ON CONFLICT(key) DO UPDATE SET value = $2
  `, [req.params.key, JSON.stringify(value)]);
    console.log(`POST /settings/${req.params.key} - saved successfully`);
    res.json({ success: true });
  } catch (error) {
    console.error(`POST /settings/${req.params.key} error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Attendance routes
router.post('/attendance/check-in', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, selfie, branch } = req.body;

    // Check Geofence (Multi-branch support)
    let geofenceTarget = null;

    if (branch) {
      const branchRes = await query('SELECT * FROM branches WHERE name = $1', [branch]);
      if (branchRes.rows.length > 0) {
        geofenceTarget = branchRes.rows[0];
      }
    }

    if (!geofenceTarget) {
      // Fallback to legacy OFFICE_LOCATION setting if no specific branch
      const settingsRes = await query('SELECT value FROM system_settings WHERE key = $1', ['OFFICE_LOCATION']);
      if (settingsRes.rows.length > 0) {
        geofenceTarget = settingsRes.rows[0].value;
      }
    }

    if (geofenceTarget) {
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Location required to mark attendance' });
      }
      const dist = getDistance(lat, lng, geofenceTarget.lat, geofenceTarget.lng);
      const allowedRadius = geofenceTarget.radius || 50;
      if (dist > allowedRadius) {
        return res.status(400).json({ error: `You are ${(dist - allowedRadius).toFixed(0)}m away from ${branch || 'office'}. Must be within ${allowedRadius}m.` });
      }
    }

    const today = new Date().toISOString().split('T')[0];
    // Check if already checked in
    const existing = await query('SELECT * FROM attendance_logs WHERE user_id = $1 AND date = $2', [req.user.id, today]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    // Determine status (Late/On Time) and Lateness minutes
    // Fetch user shift start and salary info
    const userResult = await query('SELECT shift_start, base_salary, joining_date FROM users WHERE id = $1', [req.user.id]);
    const shiftStart = userResult.rows[0]?.shift_start; // e.g., "09:00"
    const baseSalaryAtTime = userResult.rows[0]?.base_salary || 0;

    let status = 'Present';
    let lateMinutes = 0;

    if (shiftStart) {
      const [h, m] = shiftStart.split(':').map(Number);
      const now = new Date();
      const shiftTime = new Date();
      shiftTime.setHours(h, m, 0, 0);

      const diffMs = now.getTime() - shiftTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // 15 minutes grace period allowed
      if (diffMins > 15) {
        status = 'Late';
        lateMinutes = diffMins; // We store the exact amount of late minutes
      }
    }

    // Parse Selfie Data if provided
    let selfieData = null;
    let selfieMimeType = null;
    if (selfie && selfie.startsWith('data:')) {
      const matches = selfie.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        selfieMimeType = matches[1];
        selfieData = Buffer.from(matches[2], 'base64');
      }
    }

    await query(`
      INSERT INTO attendance_logs(user_id, date, check_in, status, late_minutes, base_salary_at_time, selfie_data, selfie_mimetype, branch)
      VALUES($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
    `, [req.user.id, today, status, lateMinutes, baseSalaryAtTime, selfieData, selfieMimeType, branch || null]);

    res.json({ success: true, status, lateMinutes });
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
      const presentDays = userLogs.length;

      // Calculate Total Late Minutes (only where minutes > 15)
      const totalLateMinutes = userLogs.reduce((acc, log) => {
        // Only deduct if status is 'Late' and minutes > 15
        if (log.status === 'Late' && log.late_minutes > 15) {
          return acc + (log.late_minutes - 15);
        }
        return acc;
      }, 0);

      // Calculate Working Days
      let standardSundays = 0;
      for (let d = 1; d <= endDay; d++) {
        const date = new Date(Number(year), Number(month) - 1, d);
        if (date.getDay() === 0) standardSundays++;
      }

      const standardWorkingDays = endDay - standardSundays - holidaysCount;
      const baseSalary = parseFloat(user.base_salary) || 0;
      // User requested formula: (Base Salary / 30 / 8 / 60)
      const payPerMinute = baseSalary / 30 / 8 / 60;
      const payPerDay = standardWorkingDays > 0 ? baseSalary / standardWorkingDays : 0;

      // Calculate Effective Working Days for User (Considering Join Date)
      const joinDate = user.joining_date ? new Date(user.joining_date) : null;
      let effectiveStartDay = 1;

      if (joinDate && joinDate.getFullYear() === Number(year) && joinDate.getMonth() === Number(month) - 1) {
        effectiveStartDay = joinDate.getDate();
      }

      if (joinDate && (joinDate.getFullYear() > Number(year) || (joinDate.getFullYear() === Number(year) && joinDate.getMonth() > Number(month) - 1))) {
        return { userId: user.id, name: user.name, baseSalary, workingDays: 0, presentDays: 0, lateDays: 0, finalSalary: 0 };
      }

      let userSundays = 0;
      for (let d = effectiveStartDay; d <= endDay; d++) {
        const date = new Date(Number(year), Number(month) - 1, d);
        if (date.getDay() === 0) userSundays++;
      }

      const validHolidays = holidaysRes.rows.filter(h => {
        const hDate = new Date(h.date);
        return hDate.getDate() >= effectiveStartDay;
      }).length;

      const userLength = endDay - effectiveStartDay + 1;
      const workingDays = Math.max(0, userLength - userSundays - validHolidays);

      // --- QUARTERLY LEAVE LOGIC ---
      // 1 day per month accrued. Reset Jan 1, Apr 1, Jul 1, Oct 1.
      const monthNum = Number(month);
      const quarterStartMonth = Math.floor((monthNum - 1) / 3) * 3 + 1;
      const accruedInQuarter = monthNum - quarterStartMonth + 1; // 1, 2, or 3 days

      // Count leaves taken in this quarter BEFORE this month
      const takenBeforeThisMonth = leaves.filter(l => {
        if (l.user_id !== user.id) return false;
        const lDate = new Date(l.start_date);
        const lMonth = lDate.getMonth() + 1;
        return lMonth >= quarterStartMonth && lMonth < monthNum;
      }).reduce((acc, leave) => {
        // Count days in quarter for this leave
        // (Simplified: assuming leave doesn't cross months for now, or if it does, it's rare)
        // For now, let's just count days within the quarter
        return acc + Math.round((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 3600 * 24)) + 1;
      }, 0);

      const availablePaidLeaves = Math.max(0, accruedInQuarter - takenBeforeThisMonth);

      // Current month's approved leaves
      const currentMonthLeaves = leaves.filter(l => {
        if (l.user_id !== user.id) return false;
        const lDate = new Date(l.start_date);
        return (lDate.getMonth() + 1) === monthNum;
      });

      let paidLeaveDaysUsed = 0;
      let unpaidLeaveDays = 0;

      currentMonthLeaves.forEach(leave => {
        const lStart = new Date(leave.start_date);
        const lEnd = new Date(leave.end_date);

        for (let d = new Date(lStart); d <= lEnd; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === Number(month) - 1 && d.getFullYear() === Number(year) && d.getDate() >= effectiveStartDay && d.getDate() <= endDay) {
            if (d.getDay() !== 0) {
              const isHoliday = holidaysRes.rows.some(h => new Date(h.date).toDateString() === d.toDateString());
              if (!isHoliday) {
                if (paidLeaveDaysUsed < availablePaidLeaves) {
                  paidLeaveDaysUsed++;
                } else {
                  unpaidLeaveDays++;
                }
              }
            }
          }
        }
      });

      // Deductions
      // Absent days = workingDays - presentDays - paidLeaveDaysUsed - unpaidLeaveDays
      // Wait, if they take unpaid leave, it's already an absent day.
      const absentDays = Math.max(0, workingDays - presentDays - paidLeaveDaysUsed - unpaidLeaveDays);
      const absentDeduction = (absentDays + unpaidLeaveDays) * payPerDay;

      // Late deduction: (late_minutes - 15) * (Base Salary / 30 / 8 / 60)
      const lateDeduction = totalLateMinutes * payPerMinute;

      const finalSalary = Math.round(Math.max(0, (baseSalary - absentDeduction - lateDeduction)));

      return {
        userId: user.id,
        name: user.name,
        baseSalary,
        workingDays,
        presentDays,
        paidLeaveDays: paidLeaveDaysUsed,
        unpaidLeaveDays,
        lateMinutes: totalLateMinutes,
        lateDeduction: Math.round(lateDeduction * 100) / 100,
        absentDeduction: Math.round(absentDeduction * 100) / 100,
        finalSalary
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PAYSLIP STORAGE & RETRIEVAL
router.get('/attendance/leaves/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
    const quarterEndDay = new Date(year, quarterStartMonth + 2, 0).getDate();
    const quarterStartDate = `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`;
    const quarterEndDate = `${year}-${String(quarterStartMonth + 2).padStart(2, '0')}-${quarterEndDay}`;

    // 1. Fetch user joining date and holidays
    const userRes = await query('SELECT joining_date FROM users WHERE id = $1', [userId]);
    const joiningDate = userRes.rows[0]?.joining_date ? new Date(userRes.rows[0].joining_date) : null;

    const holidaysRes = await query('SELECT date FROM holidays WHERE date >= $1 AND date <= $2', [quarterStartDate, quarterEndDate]);
    const holidayDates = holidaysRes.rows.map(h => new Date(h.date).toDateString());

    // 2. Calculate Accrued (Earned) Leaves
    // Logic: 1 day per month spent in the current quarter
    let effectiveStartMonth = quarterStartMonth;
    if (joiningDate && joiningDate.getFullYear() === year && joiningDate.getMonth() + 1 > quarterStartMonth) {
      // If joined mid-quarter, only earn for months active
      effectiveStartMonth = joiningDate.getMonth() + 1;
    } else if (joiningDate && (joiningDate.getFullYear() > year || (joiningDate.getFullYear() === year && joiningDate.getMonth() + 1 > month))) {
      // Joined in the future? 0 accrual
      return res.json({ accrued: 0, used: 0, remaining: 0, quarter: Math.floor((month - 1) / 3) + 1 });
    }

    const accruedInQuarter = Math.max(0, month - effectiveStartMonth + 1);

    // 3. Calculate Used Leaves (Excluding Sundays and Holidays)
    const leavesRes = await query(`
            SELECT start_date, end_date FROM leave_requests 
            WHERE user_id = $1 AND status = 'Approved'
            AND start_date <= $2 AND end_date >= $3
        `, [userId, quarterEndDate, quarterStartDate]);

    let usedInQuarter = 0;
    leavesRes.rows.forEach(leave => {
      const lStart = new Date(leave.start_date);
      const lEnd = new Date(leave.end_date);

      for (let d = new Date(lStart); d <= lEnd; d.setDate(d.getDate() + 1)) {
        // Only count days WITHIN the current quarter
        const dMonth = d.getMonth() + 1;
        if (d.getFullYear() === year && dMonth >= quarterStartMonth && dMonth <= quarterStartMonth + 2) {
          // Exclude Sundays (0)
          if (d.getDay() !== 0) {
            // Exclude Holidays
            if (!holidayDates.includes(d.toDateString())) {
              usedInQuarter++;
            }
          }
        }
      }
    });

    res.json({
      accrued: accruedInQuarter,
      used: usedInQuarter,
      remaining: Math.max(0, accruedInQuarter - usedInQuarter),
      quarter: Math.floor((month - 1) / 3) + 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/attendance/payslips', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { userId, month, year, pdfData } = req.body;
    if (!userId || !month || !year || !pdfData) {
      return res.status(400).json({ error: 'Missing required payslip data' });
    }

    // PDF data should be base64
    const buffer = Buffer.from(pdfData.split(',')[1] || pdfData, 'base64');

    await query(`
      INSERT INTO payslips(user_id, month, year, pdf_data)
      VALUES($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [userId, month, year, buffer]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/attendance/payslips/me', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, month, year, created_at FROM payslips WHERE user_id = $1 ORDER BY year DESC, month DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/attendance/payslips/:id', authenticateToken, async (req, res) => {
  try {
    const payslipId = req.params.id;
    const result = await query('SELECT pdf_data, month, year, user_id FROM payslips WHERE id = $1', [payslipId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    const row = result.rows[0];

    // RBAC: Staff only see their own, Admin sees all
    if (req.user.role !== 'Admin' && row.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${row.month}_${row.year}.pdf`);
    res.send(row.pdf_data);
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


// ==========================================
// UNIVERSITY COURSES ROUTES
// ==========================================

// Get all university courses (with optional filtering)
router.get('/university-courses', authenticateToken, async (req, res) => {
  try {
    const { country } = req.query;
    let queryText = 'SELECT * FROM university_courses';
    const params = [];

    if (country) {
      queryText += ' WHERE country = $1';
      params.push(country);
    }

    queryText += ' ORDER BY university_name, course_name';

    const result = await query(queryText, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      universityName: row.university_name,
      country: row.country,
      courseName: row.course_name,
      intake: row.intake,
      minSscPercent: parseFloat(row.min_ssc_percent),
      minInterPercent: parseFloat(row.min_inter_percent),
      minDegreePercent: row.min_degree_percent ? parseFloat(row.min_degree_percent) : null,
      requiredExam: row.required_exam,
      minExamScore: row.min_exam_score ? parseFloat(row.min_exam_score) : null,
      acceptedExams: row.accepted_exams || [],
      applicationFee: row.application_fee,
      enrollmentDeposit: row.enrollment_deposit,
      wesRequirement: row.wes_requirement,
      logoUrl: row.logo_url,
      createdAt: row.created_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new university course (Admin/Staff only)
router.post('/university-courses', authenticateToken, async (req, res) => {
  if (req.user.role === 'Student') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  try {
    const {
      universityName, country, courseName, intake,
      minSscPercent, minInterPercent, minDegreePercent,
      requiredExam, minExamScore, acceptedExams,
      applicationFee, enrollmentDeposit, wesRequirement
    } = req.body;

    const result = await query(`
      INSERT INTO university_courses (
        university_name, country, course_name, intake,
        min_ssc_percent, min_inter_percent, min_degree_percent,
        required_exam, min_exam_score, accepted_exams,
        application_fee, enrollment_deposit, wes_requirement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      universityName, country, courseName, intake,
      minSscPercent, minInterPercent, minDegreePercent,
      requiredExam, minExamScore,
      JSON.stringify(acceptedExams || []),
      applicationFee, enrollmentDeposit, wesRequirement
    ]);

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      universityName: row.university_name,
      country: row.country,
      courseName: row.course_name,
      intake: row.intake,
      minSscPercent: parseFloat(row.min_ssc_percent),
      minInterPercent: parseFloat(row.min_inter_percent),
      minDegreePercent: row.min_degree_percent ? parseFloat(row.min_degree_percent) : null,
      requiredExam: row.required_exam,
      minExamScore: row.min_exam_score ? parseFloat(row.min_exam_score) : null,
      acceptedExams: row.accepted_exams || [],
      applicationFee: row.application_fee,
      enrollmentDeposit: row.enrollment_deposit,
      wesRequirement: row.wes_requirement,
      logoUrl: row.logo_url,
      createdAt: row.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a university course (Admin/Staff only)
router.put('/university-courses/:id', authenticateToken, async (req, res) => {
  if (req.user.role === 'Student') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  try {
    const {
      universityName, country, courseName, intake,
      minSscPercent, minInterPercent, minDegreePercent,
      requiredExam, minExamScore, acceptedExams,
      applicationFee, enrollmentDeposit, wesRequirement
    } = req.body;

    const result = await query(`
      UPDATE university_courses
      SET university_name = $1, country = $2, course_name = $3, intake = $4,
          min_ssc_percent = $5, min_inter_percent = $6, min_degree_percent = $7,
          required_exam = $8, min_exam_score = $9, accepted_exams = $10,
          application_fee = $11, enrollment_deposit = $12, wes_requirement = $13
      WHERE id = $14
      RETURNING *
    `, [
      universityName, country, courseName, intake,
      minSscPercent, minInterPercent, minDegreePercent,
      requiredExam, minExamScore,
      JSON.stringify(acceptedExams || []),
      applicationFee, enrollmentDeposit, wesRequirement,
      req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      universityName: row.university_name,
      country: row.country,
      courseName: row.course_name,
      intake: row.intake,
      minSscPercent: parseFloat(row.min_ssc_percent),
      minInterPercent: parseFloat(row.min_inter_percent),
      minDegreePercent: row.min_degree_percent ? parseFloat(row.min_degree_percent) : null,
      requiredExam: row.required_exam,
      minExamScore: row.min_exam_score ? parseFloat(row.min_exam_score) : null,
      acceptedExams: row.accepted_exams || [],
      applicationFee: row.application_fee,
      enrollmentDeposit: row.enrollment_deposit,
      wesRequirement: row.wes_requirement,
      logoUrl: row.logo_url,
      createdAt: row.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a university course (Admin/Staff only)
router.delete('/university-courses/:id', authenticateToken, async (req, res) => {
  if (req.user.role === 'Student') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  try {
    const result = await query('DELETE FROM university_courses WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Serve university logo from DB
router.get('/university-courses/:id/logo', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT logo_data, logo_mimetype FROM university_courses WHERE id = $1', [id]);

    if (result.rows.length === 0 || !result.rows[0].logo_data) {
      return res.status(404).send('Logo not found');
    }

    const { logo_data, logo_mimetype } = result.rows[0];
    res.setHeader('Content-Type', logo_mimetype || 'image/jpeg');
    res.send(logo_data);
  } catch (error) {
    console.error('Error serving logo:', error);
    res.status(500).send('Error serving logo');
  }
});

// University logo upload route (DB Storage)
router.post('/university-courses/:id/logo', authenticateToken, uploadAvatar.single('logo'), async (req, res) => {
  if (req.user.role === 'Student') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  try {
    const courseId = parseInt(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: 'No logo uploaded' });
    }

    const file = req.file;
    const logoUrl = `/university-courses/${courseId}/logo?t=${Date.now()}`;

    // Update logo_data, mimetype, and set the URL to point to our serving endpoint
    const result = await query(
      'UPDATE university_courses SET logo_url = $1, logo_data = $2, logo_mimetype = $3 WHERE id = $4 RETURNING logo_url',
      [logoUrl, file.buffer, file.mimetype, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ success: true, logoUrl: result.rows[0].logo_url });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chatbot endpoint using OpenRouter API (StepFun 3.5 Flash)
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on the server.' });
    }

    const systemPrompt = `You are the Lyceum Academy AI Assistant. Your goal is to help users with study abroad inquiries, test prep, and navigating our platform.

Strict Rules:
1. ONLY answer questions related to studying abroad, test preparation (IELTS, PTE, TOEFL, Duolingo), universities, destinations, visas, and enrolling at Lyceum Academy.
2. If a user asks about anything else (e.g., coding, general knowledge, etc.), politely decline and steer them back to our services.
3. When users ask about "Singapore visit" or destinations, guide them and provide this exact link: /destinations/singapore
4. When users ask about "Duolingo", guide them and provide this exact link: /duolingo
5. Keep answers concise, friendly, and professional. Use markdown. Link formatting should follow standard markdown [link text](url).`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://lyceumacademy.com',
        'X-Title': 'Lyceum Academy AI Assistant'
      },
      body: JSON.stringify({
        model: 'stepfun/step-3.5-flash:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API Error:', errorData);
      return res.status(response.status).json({ error: 'Failed to communicate with the AI assistant.' });
    }

    const data = await response.json();
    console.log('OpenRouter Response Data:', JSON.stringify(data, null, 2));
    const reply = data.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


// ==========================================
// LIVE SESSION MONITOR — Admin Only
// ==========================================

// GET all active sessions
router.get('/admin/active-sessions', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    // Clean up stale sessions (inactive for more than 2 hours)
    // Archive them first
    await query(`
      INSERT INTO session_history (user_id, username, role, ip_address, device_info, last_page, login_time, end_time, reason)
      SELECT user_id, username, role, ip_address, device_info, last_page, login_time, NOW(), 'Timeout'
      FROM active_sessions 
      WHERE last_activity < NOW() - INTERVAL '2 hours'
    `);

    await query(`
      DELETE FROM active_sessions 
      WHERE last_activity < NOW() - INTERVAL '2 hours'
    `);

    const result = await query(`
      SELECT id, user_id, username, role, ip_address, device_info, last_page, login_time, last_activity
      FROM active_sessions
      ORDER BY last_activity DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Active sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE (terminate) a user session
router.delete('/admin/sessions/:userId', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    // Prevent admin from terminating their own session
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot terminate your own session' });
    }

    // Get the session token_hash for this user
    const sessionResult = await query(
      'SELECT token_hash FROM active_sessions WHERE user_id = $1',
      [targetUserId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active session found for this user' });
    }

    const { token_hash } = sessionResult.rows[0];

    // Add token to blacklist
    await query(
      'INSERT INTO token_blacklist (token_hash, invalidated_at) VALUES ($1, NOW()) ON CONFLICT (token_hash) DO NOTHING',
      [token_hash]
    );

    // Archive before deleting
    await query(`
      INSERT INTO session_history (user_id, username, role, ip_address, device_info, last_page, login_time, end_time, reason)
      SELECT user_id, username, role, ip_address, device_info, last_page, login_time, NOW(), 'Terminated by Admin'
      FROM active_sessions WHERE user_id = $1
    `, [targetUserId]);

    // Remove from active sessions
    await query('DELETE FROM active_sessions WHERE user_id = $1', [targetUserId]);

    console.log(`🔴 Session terminated for user ID: ${targetUserId} by admin ${req.user.email}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE (terminate ALL except requester) — Panic Button
router.delete('/admin/sessions', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const adminId = req.user.id;

    // 1. Get all tokens to blacklist (except admin's)
    const sessionsToKill = await query(
      'SELECT token_hash, user_id, username, role, ip_address, device_info, last_page, login_time FROM active_sessions WHERE user_id != $1',
      [adminId]
    );

    if (sessionsToKill.rows.length === 0) {
      return res.json({ success: true, message: 'No other active sessions to terminate' });
    }

    const tokens = sessionsToKill.rows.map(s => s.token_hash);

    // 2. Archive to history
    await query(`
      INSERT INTO session_history (user_id, username, role, ip_address, device_info, last_page, login_time, end_time, reason)
      SELECT user_id, username, role, ip_address, device_info, last_page, login_time, NOW(), 'Bulk Termination (Panic Button)'
      FROM active_sessions WHERE user_id != $1
    `, [adminId]);

    // 3. Blacklist all tokens
    // PostgreSQL unnest can be used for bulk insert from array
    await query(`
      INSERT INTO token_blacklist (token_hash, invalidated_at)
      SELECT unnest($1::text[]), NOW()
      ON CONFLICT (token_hash) DO NOTHING
    `, [tokens]);

    // 4. Remove from active sessions
    await query('DELETE FROM active_sessions WHERE user_id != $1', [adminId]);

    console.warn(`🚨 PANIC BUTTON: Admin ${req.user.email} terminated ${sessionsToKill.rows.length} sessions.`);
    res.json({ success: true, count: sessionsToKill.rows.length });
  } catch (error) {
    console.error('Panic button error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET session history (audit log)
router.get('/admin/session-history', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM session_history 
      ORDER BY end_time DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Session history error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/session-history/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM session_history WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /admin/session-history/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/contacts/:contactId/mock-interview-sessions/:sessionId', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { contactId, sessionId } = req.params;

    // Fetch contact
    const result = await query('SELECT metadata FROM contacts WHERE id = $1', [contactId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    let metadata = result.rows[0].metadata || {};
    if (typeof metadata === 'string') {
      try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
    }
    const sessions = metadata.mockInterviewSessions || [];

    // Filter out the session
    const updatedSessions = sessions.filter(s => s.id !== sessionId);

    if (sessions.length === updatedSessions.length) {
      return res.status(404).json({ error: 'Session not found in contact metadata' });
    }

    // Update metadata
    const updatedMetadata = { ...metadata, mockInterviewSessions: updatedSessions };

    await query('UPDATE contacts SET metadata = $1 WHERE id = $2', [JSON.stringify(updatedMetadata), contactId]);

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE mock-interview-session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- AUTOMATION RULES CRUD ---
router.get('/automation-rules', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM automation_rules ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/automation-rules', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, trigger_event, conditions, action_send_email, email_template_id, email_recipient, action_create_task, task_template, action_send_whatsapp, whatsapp_template, action_update_field, update_field_config, is_active } = req.body;
    const result = await query(`
      INSERT INTO automation_rules (
        name, trigger_event, conditions, action_send_email, email_template_id, 
        email_recipient, action_create_task, task_template, action_send_whatsapp, 
        whatsapp_template, action_update_field, update_field_config, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
    `, [
      name, trigger_event, JSON.stringify(conditions || []), action_send_email || false,
      email_template_id || null, email_recipient || 'client', action_create_task || false,
      JSON.stringify(task_template || {}), action_send_whatsapp || false,
      whatsapp_template || null, action_update_field || false,
      JSON.stringify(update_field_config || {}), is_active !== false
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/automation-rules/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, trigger_event, conditions, action_send_email, email_template_id, email_recipient, action_create_task, task_template, action_send_whatsapp, whatsapp_template, action_update_field, update_field_config, is_active } = req.body;
    const result = await query(`
      UPDATE automation_rules SET 
        name = $1, trigger_event = $2, conditions = $3, action_send_email = $4, 
        email_template_id = $5, email_recipient = $6, action_create_task = $7, 
        task_template = $8, action_send_whatsapp = $9, whatsapp_template = $10, 
        action_update_field = $11, update_field_config = $12, is_active = $13
      WHERE id = $14 RETURNING *
    `, [
      name, trigger_event, JSON.stringify(conditions || []), action_send_email,
      email_template_id || null, email_recipient, action_create_task,
      JSON.stringify(task_template || {}), action_send_whatsapp,
      whatsapp_template, action_update_field || false,
      JSON.stringify(update_field_config || {}), is_active !== false, req.params.id
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/automation-rules/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    await query('DELETE FROM automation_rules WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/automations/trigger', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const { type, payload } = req.body;
    console.log(`🤖 [Automation] Manual trigger: ${type}`);
    await evaluateAutomation(type, payload);
    res.json({ success: true });
  } catch (error) {
    console.error('Automation trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- EMAIL TEMPLATES CRUD ---
router.get('/email-templates', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM email_templates ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/email-templates', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, subject, body, from_address } = req.body;
    const result = await query(`
      INSERT INTO email_templates (name, subject, body, from_address)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, subject, body, from_address || null]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/email-templates/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, subject, body, from_address } = req.body;
    const result = await query(`
      UPDATE email_templates
      SET name = $1, subject = $2, body = $3, from_address = $4
      WHERE id = $5 RETURNING *
    `, [name, subject, body, from_address || null, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/email-templates/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    await query('DELETE FROM email_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Cannot delete template. It might be in use by an automation rule.' });
  }
});

// --- AUTOMATION LOGS ---
router.get('/automation-logs', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, r.name as rule_name 
      FROM automation_logs l
      LEFT JOIN automation_rules r ON l.rule_id = r.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Draft Generation for Email Templates
router.post('/automation/generate-draft', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured.' });
    }

    const systemPrompt = `You are an expert CRM automation copywriter. Draft a professional email based on the user's request.
Keep it concise. Use ONLY the following variable tags for personalization:
- {{contact_name}} (Full name of the contact)
- {{first_name}} (First name only)
- {{contact_email}} (Contact's email address)
- {{company_name}} (Name of the lead's company)
- {{lead_source}} (Where the lead came from)
- {{lead_stage}} (Current stage of the lead)

Return your response in JSON format: { "subject": "...", "body": "..." }`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://lyceumacademy.com',
        'X-Title': 'Lyceum Academy Automation'
      },
      body: JSON.stringify({
        model: 'stepfun/step-3.5-flash:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Draft an email for: ${prompt}. Context: ${context || 'General CRM'}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway Error Response:', errorText);
      throw new Error(`AI Gateway Error: ${errorText}`);
    }

    const data = await response.json();
    const contentString = data.choices[0].message.content;

    try {
      const content = JSON.parse(contentString);
      res.json(content);
    } catch (parseErr) {
      console.error('Failed to parse AI response JSON:', contentString);
      // Fallback: If not JSON, try to extract subject/body or just return it as body
      res.json({
        subject: "Automated Draft",
        body: contentString
      });
    }
  } catch (error) {
    console.error('AI Draft full error:', error);
    res.status(500).json({ error: 'Failed to generate AI draft: ' + error.message });
  }
});

// ─── ANNOUNCEMENTS ROUTES ──────────────────────────────────────────────────

// Create announcement (Admin/Staff)
router.post('/announcements', authenticateToken, requireRole('Admin', 'Staff'), upload.array('attachments'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { title, content, audienceFilters, sendViaEmail, scheduledAt } = req.body;

    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    const parsedFilters = typeof audienceFilters === 'string' ? JSON.parse(audienceFilters) : (audienceFilters || {});

    const result = await client.query(`
      INSERT INTO announcements (title, content, audience_filters, send_via_email, scheduled_at, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, content, JSON.stringify(parsedFilters), sendViaEmail === 'true' || sendViaEmail === true, scheduledAt || null, scheduledAt ? 'Upcoming' : 'Delivered', req.user.id]);

    const announcement = result.rows[0];

    // Handle attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await client.query(`
          INSERT INTO announcement_attachments (announcement_id, filename, content_type, file_data, file_size)
          VALUES ($1, $2, $3, $4, $5)
        `, [announcement.id, file.originalname, file.mimetype, file.buffer, file.size]);
      }
    }

    await client.query('COMMIT');

    // Email broadcast (Non-blocking)
    if (announcement.send_via_email && announcement.status === 'Delivered') {
      (async () => {
        try {
          console.log(`📢 Starting email broadcast for announcement: ${announcement.title}`);

          let recipientQuery = `
            SELECT u.email, c.name 
            FROM contacts c 
            JOIN users u ON c.user_id = u.id 
            WHERE u.role = 'Student'
          `;
          const values = [];
          let pCount = 1;

          if (parsedFilters.visaType) {
            recipientQuery += ` AND c.visa_type = $${pCount++}`;
            values.push(parsedFilters.visaType);
          }
          if (parsedFilters.degree) {
            recipientQuery += ` AND c.degree = $${pCount++}`;
            values.push(parsedFilters.degree);
          }
          if (parsedFilters.fileStatus) {
            recipientQuery += ` AND c.file_status = $${pCount++}`;
            values.push(parsedFilters.fileStatus);
          }

          const recipients = await query(recipientQuery, values);
          console.log(`👥 Found ${recipients.rows.length} targeted recipients for email.`);

          for (const recipient of recipients.rows) {
            if (recipient.email) {
              await sendAnnouncementEmail(
                recipient.email,
                recipient.name || 'Student',
                announcement.title,
                announcement.content,
                req.files // Pass attachments here
              );
            }
          }
          console.log(`✅ Email broadcast completed for: ${announcement.title}`);
        } catch (emailErr) {
          console.error('❌ Error in announcement email broadcast:', emailErr);
        }
      })();
    }

    res.json(announcement);
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Error creating announcement:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

// List announcements (Admin/Staff)
router.get('/announcements', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.name as creator_name,
             (SELECT COUNT(*)::int FROM announcement_reads WHERE announcement_id = a.id) as read_count,
             (SELECT json_agg(json_build_object('id', id, 'filename', filename, 'size', file_size)) 
              FROM announcement_attachments WHERE announcement_id = a.id) as attachments_list
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Preview recipient count
router.get('/announcements/preview-count', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const filters = req.query;
    let queryText = 'SELECT COUNT(*)::int FROM contacts c JOIN users u ON c.user_id = u.id WHERE u.role = \'Student\'';
    const values = [];
    let pCount = 1;

    if (filters.visaType) {
      queryText += ` AND c.visa_type = $${pCount++}`;
      values.push(filters.visaType);
    }
    if (filters.degree) {
      queryText += ` AND c.degree = $${pCount++}`;
      values.push(filters.degree);
    }
    if (filters.fileStatus) {
      queryText += ` AND c.file_status = $${pCount++}`;
      values.push(filters.fileStatus);
    }

    const result = await query(queryText, values);
    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error('Error previewing count:', error);
    res.status(500).json({ error: error.message });
  }
});

// List announcements for student
router.get('/student/announcements', authenticateToken, requireRole('Student'), async (req, res) => {
  try {
    console.log(`📢 Fetching announcements for student: ${req.user.id} (${req.user.role})`);

    // 1. Get student profile details for filtering
    const studentRes = await query('SELECT * FROM contacts WHERE user_id = $1', [req.user.id]);
    if (studentRes.rows.length === 0) {
      console.log('⚠️ No contact found for student user');
      return res.json([]);
    }
    const student = studentRes.rows[0];
    console.log(`👤 Student profile found: ${student.name}`);

    // 2. Fetch announcements and check if they match student's filters
    const announcementsRes = await query(`
      SELECT a.*, ar.read_at,
             (SELECT json_agg(json_build_object('id', id, 'filename', filename, 'size', file_size)) 
              FROM announcement_attachments WHERE announcement_id = a.id) as attachments_list
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = $1
      WHERE a.status = 'Delivered'
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    console.log(`📋 Total announcements found: ${announcementsRes.rows.length}`);

    // 3. Filter on backend for performance
    const filtered = announcementsRes.rows.filter(ann => {
      try {
        const filters = ann.audience_filters || {};
        if (Object.keys(filters).length === 0) return true; // Sent to all

        // Apply target criteria
        if (filters.visaType && filters.visaType !== student.visa_type) return false;
        if (filters.degree && filters.degree !== student.degree) return false;
        if (filters.fileStatus && filters.fileStatus !== student.file_status) return false;

        return true;
      } catch (fError) {
        console.error('Error filtering announcement:', ann.id, fError);
        return false;
      }
    });

    console.log(`✅ Returning ${filtered.length} filtered announcements`);

    res.json(filtered.map(a => ({
      ...a,
      isRead: !!a.read_at
    })));
  } catch (error) {
    console.error('❌ Error fetching student announcements:', error);
    res.status(500).json({
      error: error.message,
      detail: error.stack
    });
  }
});

// Mark as read
router.put('/student/announcements/:id/read', authenticateToken, async (req, res) => {
  try {
    console.log(`📢 Marking announcement ${req.params.id} as read for user ${req.user.id}`);
    await query(`
      INSERT INTO announcement_reads (announcement_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download announcement attachment
router.get('/announcements/attachments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM announcement_attachments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = result.rows[0];

    // Optional: Add permission check here to ensure user has access to this announcement

    res.setHeader('Content-Type', attachment.content_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.send(attachment.file_data);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete announcement
router.delete('/announcements/:id', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    await query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- MOCK INTERVIEW QUESTIONS CRUD ---
router.get('/mock-interview/questions', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM mock_interview_questions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mock-interview/questions', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const { question_text, category, difficulty } = req.body;
    const result = await query(
      'INSERT INTO mock_interview_questions (question_text, category, difficulty) VALUES ($1, $2, $3) RETURNING *',
      [question_text, category, difficulty]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('POST /mock-interview/questions error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/mock-interview/questions/:id', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const { question_text, category, difficulty } = req.body;
    const result = await query(
      'UPDATE mock_interview_questions SET question_text = $1, category = $2, difficulty = $3 WHERE id = $4 RETURNING *',
      [question_text, category, difficulty, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT /mock-interview/questions/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/mock-interview/questions/:id', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    await query('DELETE FROM mock_interview_questions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MOCK INTERVIEW TEMPLATES CRUD ---
router.get('/mock-interview/templates', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM mock_interview_templates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('GET /mock-interview/templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/mock-interview/templates', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const { name, description, difficulty, visa_types, questions } = req.body;
    const result = await query(
      'INSERT INTO mock_interview_templates (name, description, difficulty, visa_types, questions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, difficulty, visa_types, JSON.stringify(questions || [])]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('POST /mock-interview/templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/mock-interview/templates/:id', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    const { name, description, difficulty, visa_types, questions } = req.body;
    const result = await query(
      'UPDATE mock_interview_templates SET name = $1, description = $2, difficulty = $3, visa_types = $4, questions = $5 WHERE id = $6 RETURNING *',
      [name, description, difficulty, visa_types, JSON.stringify(questions || []), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT /mock-interview/templates/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/mock-interview/templates/:id', authenticateToken, requireRole('Admin', 'Staff'), async (req, res) => {
  try {
    await query('DELETE FROM mock_interview_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /mock-interview/templates/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Feedback Generation
router.post('/mock-interview/generate-feedback', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is missing in environment variables');
      return res.status(500).json({ error: 'AI service not configured on server' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://lyceumlms.com',
        'X-Title': 'Lyceum Academy Mock Interview',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a \"Special Agent\" and Senior US Visa Interview Expert. You provide extremely high-end, rigorous, and professional mock interview evaluations. Your feedback must be authoritative, clear, and high-impact. Avoid long, speech-like paragraphs. Instead, use concise bullet points, bold text for key takeaways, and provide clear, actionable strategies for success. Focus on the nuances of communication, intent, and consistency needed for a successful visa interview.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', response.status, errorData);
      return res.status(response.status).json({ error: errorData.error?.message || `AI service error: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AI Feedback generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

// trigger reload 1770196752
// trigger reload 1770196793
// trigger reload 1770196806
// trigger reload 1770196899
