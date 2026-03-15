import express from 'express';
import announcementAdminRoutes from './modules/admin/announcements/index.js';
import announcementStudentRoutes from './modules/student/announcements/index.js';
import sharedStatusRoutes from './modules/shared/status.js';
import sharedUploadRoutes from './modules/shared/uploads.js';

const router = express.Router();

router.use('/announcements', announcementAdminRoutes);
router.use('/', announcementStudentRoutes);
router.use('/status', sharedStatusRoutes);
router.use('/uploads', sharedUploadRoutes);

export default router;
