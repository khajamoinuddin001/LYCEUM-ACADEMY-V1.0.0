import * as service from './service.js';

export async function getMyAnnouncements(req, res) {
    try {
        const result = await service.getStudentAnnouncements(req.user.id);
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch student announcements error:', error);
        res.status(500).json({ error: 'Failed to fetch your announcements' });
    }
}

export async function markAsRead(req, res) {
    try {
        await service.markAnnouncementRead(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
}
