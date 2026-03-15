import { query } from '../../../../../database.js';

export async function getStudentAnnouncements(userId) {
    return query(`
        SELECT a.*, ar.is_read, ar.read_at
        FROM announcements a
        JOIN announcement_recipients ar ON a.id = ar.announcement_id
        WHERE ar.user_id = $1 AND (a.scheduled_at IS NULL OR a.scheduled_at <= NOW())
        ORDER BY a.sent_at DESC, a.created_at DESC
    `, [userId]);
}

export async function markAnnouncementRead(announcementId, userId) {
    return query(`
        UPDATE announcement_recipients 
        SET is_read = true, read_at = NOW()
        WHERE announcement_id = $1 AND user_id = $2
    `, [announcementId, userId]);
}
