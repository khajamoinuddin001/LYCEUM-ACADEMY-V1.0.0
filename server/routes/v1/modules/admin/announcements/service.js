import { query } from '../../../../../database.js';

export async function getFilteredUserIds(filters) {
    const { fileStatus, visaType, studentDegree, leadStatus } = filters;
    
    let queryStr = 'SELECT u.id FROM users u';
    let conditions = ["u.role = 'Student'"];
    let params = [];
    let paramIdx = 1;

    if ((fileStatus && fileStatus !== 'All') || (visaType && visaType !== 'All')) {
        queryStr += ' JOIN contacts c ON c.user_id = u.id';
        
        if (fileStatus && fileStatus !== 'All') {
            conditions.push(`c.file_status = $${paramIdx++}`);
            params.push(fileStatus);
        }
        
        if (visaType && visaType !== 'All') {
            conditions.push(`c.visa_type = $${paramIdx++}`);
            params.push(visaType);
            
            if (visaType === 'Student Visa' && studentDegree && studentDegree !== 'All') {
                conditions.push(`c.degree = $${paramIdx++}`);
                params.push(studentDegree);
            }
        }
    }

    if (leadStatus && leadStatus !== 'All') {
        queryStr += ` JOIN leads l ON LOWER(l.email) = LOWER(u.email)`;
        conditions.push(`l.stage = $${paramIdx++}`);
        params.push(leadStatus);
    }

    if (conditions.length > 0) {
        queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const res = await query(queryStr, params);
        return res.rows.map(row => row.id);
    } catch (error) {
        console.error('getFilteredUserIds error:', error);
        return [];
    }
}

export async function getAllAnnouncements() {
    return query(`
        SELECT a.*, u.name as creator_name 
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
    `);
}

export async function createAnnouncement({ title, content, filters, attachments, scheduleDate, userId, userIds, sendEmail }) {
    const announcementRes = await query(`
        INSERT INTO announcements (title, content, filter_data, attachments, scheduled_at, created_by, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    `, [
        title, 
        content, 
        JSON.stringify(filters), 
        JSON.stringify(attachments || []), 
        scheduleDate || null, 
        userId,
        scheduleDate ? null : new Date()
    ]);
    
    const announcementId = announcementRes.rows[0].id;
    
    // Link DB attachments
    if (attachments && Array.isArray(attachments)) {
        const attachmentIds = attachments.map(a => a.id).filter(id => id);
        if (attachmentIds.length > 0) {
            await query(
                'UPDATE announcement_attachments SET announcement_id = $1 WHERE id = ANY($2)',
                [announcementId, attachmentIds]
            );
        }
    }
    
    if (userIds.length > 0) {
        const values = userIds.map(uid => `(${announcementId}, ${uid})`).join(',');
        await query(`INSERT INTO announcement_recipients (announcement_id, user_id) VALUES ${values}`);
        
        // Handle Email Notifications
        if (sendEmail && !scheduleDate) {
            try {
                const { sendAnnouncementEmail } = await import('../../../../../email.js');
                const emailRes = await query('SELECT email, name FROM users WHERE id = ANY($1)', [userIds]);
                console.log(`📧 Sending announcement emails to ${emailRes.rows.length} students...`);
                
                // Fire and forget email sending to not block the main response
                emailRes.rows.forEach(user => {
                    sendAnnouncementEmail(user.email, user.name, title, content).catch(err => {
                        console.error(`Failed to send email to ${user.email}:`, err.message);
                    });
                });
            } catch (emailErr) {
                console.error('Failed to initiate email sending:', emailErr.message);
            }
        }
    }
    
    return announcementId;
}

export async function deleteAnnouncement(id) {
    return query('DELETE FROM announcements WHERE id = $1', [id]);
}
