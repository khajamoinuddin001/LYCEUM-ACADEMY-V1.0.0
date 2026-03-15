import * as service from './service.js';
import { query } from '../../../../../database.js';

export async function getAnnouncements(req, res) {
    if (req.user.role === 'Student') return res.status(403).json({ error: 'Access denied' });
    
    try {
        const result = await service.getAllAnnouncements();
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch announcements error:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
}

export async function getRecipientCount(req, res) {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
    
    try {
        const filters = {
            fileStatus: req.query.fileStatus,
            visaType: req.query.visaType,
            studentDegree: req.query.studentDegree,
            leadStatus: req.query.leadStatus
        };
        
        const userIds = await service.getFilteredUserIds(filters);
        res.json({ count: userIds.length });
    } catch (error) {
        console.error('Count recipients error:', error);
        res.status(500).json({ error: 'Failed to count recipients' });
    }
}

export async function createAnnouncement(req, res) {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
    
    const { title, content, filters, attachments, scheduleDate, sendEmail } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const userIds = await service.getFilteredUserIds(filters);
        
        const announcementId = await service.createAnnouncement({
            title,
            content,
            filters,
            attachments,
            scheduleDate,
            userId: req.user.id,
            userIds,
            sendEmail
        });
        
        res.json({ success: true, id: announcementId, recipientCount: userIds.length });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
}

export async function deleteAnnouncement(req, res) {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
    
    try {
        await service.deleteAnnouncement(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
}
