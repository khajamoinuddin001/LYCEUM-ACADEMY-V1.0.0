import express from 'express';
import * as controller from './controller.js';
import { authenticateToken } from '../../../../../auth.js';

const router = express.Router();

router.get('/', authenticateToken, controller.getAnnouncements);
router.get('/recipient-count', authenticateToken, controller.getRecipientCount);
router.post('/', authenticateToken, controller.createAnnouncement);
router.delete('/:id', authenticateToken, controller.deleteAnnouncement);

export default router;
