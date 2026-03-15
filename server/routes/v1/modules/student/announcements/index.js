import express from 'express';
import * as controller from './controller.js';
import { authenticateToken } from '../../../../../auth.js';

const router = express.Router();

router.get('/my-announcements', authenticateToken, controller.getMyAnnouncements);
router.post('/my-announcements/:id/read', authenticateToken, controller.markAsRead);

export default router;
