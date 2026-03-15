import express from 'express';
import { query } from '../../../../database.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'active',
        engine: 'v1-modular-feature-based',
        timestamp: new Date()
    });
});

export default router;
