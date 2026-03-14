import express from 'express';

const router = express.Router();

// Legacy API Provider V1 - Basic logic
router.get('/health', (req, res) => {
    res.json({ status: 'active', engine: 'v1-legacy', timestamp: new Date() });
});

router.get('/status', (req, res) => {
    res.json({ service: 'api-gateway', version: '1.0.4', load: 'normal' });
});

router.post('/sync', (req, res) => {
    res.json({ success: true, message: 'Sync scheduled' });
});

export default router;
