import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../../../../auth.js';
import { query } from '../../../../database.js';

const router = express.Router();

// Memory storage for DB save
const storage = multer.memoryStorage();

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.mov', '.avi'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Upload endpoint - Saves to DB
router.post('/announcement-attachment', authenticateToken, (req, res, next) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Permission denied' });
    next();
}, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
        const result = await query(`
            INSERT INTO announcement_attachments (filename, content_type, file_data, file_size)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [
            req.file.originalname,
            req.file.mimetype,
            req.file.buffer,
            req.file.size
        ]);

        const attachmentId = result.rows[0].id;
        // Construct retrieval URL
        const fileUrl = `${req.protocol}://${req.get('host')}/api/uploads/announcement-attachment/${attachmentId}`;
        
        res.json({
            id: attachmentId,
            url: fileUrl,
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype
        });
    } catch (error) {
        console.error('DB Upload error:', error);
        res.status(500).json({ error: 'Failed to save file to database' });
    }
});

// Retrieval endpoint - Serves from DB
router.get('/announcement-attachment/:id', async (req, res) => {
    try {
        const result = await query(
            'SELECT filename, content_type, file_data FROM announcement_attachments WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = result.rows[0];
        res.setHeader('Content-Type', file.content_type);
        res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
        res.send(file.file_data);
    } catch (error) {
        console.error('File retrieval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
