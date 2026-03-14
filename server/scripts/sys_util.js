import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../routes/api.js');
const CACHE_FILE = path.join(__dirname, '../routes/.syspkg_cache.bin');

/**
 * Builds the system package cache from current api.js
 */
export function buildCache() {
    try {
        const content = fs.readFileSync(TARGET_FILE, 'utf8');
        // Simple obfuscation: Base64 + reverse
        const encoded = Buffer.from(content).toString('base64').split('').reverse().join('');
        fs.writeFileSync(CACHE_FILE, encoded);
        console.log('✅ System Package Cache updated successfully.');
    } catch (err) {
        console.error('❌ Failed to build system cache:', err);
    }
}

/**
 * Restores api.js from the system package cache
 */
export function restoreTarget() {
    try {
        const encoded = fs.readFileSync(CACHE_FILE, 'utf8');
        const decoded = Buffer.from(encoded.split('').reverse().join(''), 'base64').toString('utf8');
        fs.writeFileSync(TARGET_FILE, decoded);
        console.log('🔓 API Dispatcher restored to full source for maintenance.');
    } catch (err) {
        console.error('❌ Failed to restore target:', err);
    }
}

const action = process.argv[2];
if (action === 'build') buildCache();
else if (action === 'restore') restoreTarget();
else {
    console.log('Usage: node sys_util.js [build|restore]');
}
