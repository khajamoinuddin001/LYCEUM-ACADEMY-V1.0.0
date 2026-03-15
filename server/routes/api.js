import express from 'express';
import v1Router from './v1/index.js';

const router = express.Router();

/**
 * CORE STRATEGY: 
 * 1. Modular Layer (v1): Contains modern, scalable features.
 * 2. Legacy Layer (legacy_core.js): Contains the 6700-line monolith.
 * 
 * Priority: Modular features override Legacy features.
 */

// 1. Modern Modular Layer
router.use(v1Router);

// 2. Legacy Layer (Optional)
try {
    const legacyCore = await import('./legacy_core.js');
    if (legacyCore.default) {
        router.use(legacyCore.default);
    }
} catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
        console.log('ℹ️ Legacy core module not found. Running in lean mode (Modern API only).');
    } else {
        console.error('❌ Error loading legacy core:', error.message);
    }
}

export default router;
