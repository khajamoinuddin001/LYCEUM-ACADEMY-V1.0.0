import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory rate tracking: keyId -> { count: number }
export const apiKeyUsage = new Map();

// Reset usage counts every minute
setInterval(() => {
  apiKeyUsage.clear();
}, 60000);

export function getApiKeyUsage(keyId, limit) {
  const usage = apiKeyUsage.get(keyId) || { count: 0 };
  const currentLimit = limit || 60;
  return {
    count: usage.count,
    remaining: Math.max(0, currentLimit - usage.count),
    limit: currentLimit
  };
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET is not defined in production environment!');
    }
    return 'your-secret-key-change-in-production';
  }
  return secret;
};

export function generateToken(user, expiresIn = '7d') {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getSecret(),
    { expiresIn }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Global Panic Switch check
 */
async function isGlobalApiPanicked() {
  try {
    const { query } = await import('./database.js');
    const result = await query("SELECT value FROM system_settings WHERE key = 'global_api_panic'");
    return result.rows.length > 0 && result.rows[0].value === 'true';
  } catch (e) {
    console.error('Error checking global panic status:', e);
    return false;
  }
}

/**
 * Log API Key Activity
 */
async function logApiKeyActivity(keyId, endpoint, method, ipAddress, statusCode, userAgent) {
  try {
    const { query } = await import('./database.js');
    await query(
      'INSERT INTO api_key_logs (key_id, endpoint, method, ip_address, status_code, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
      [keyId, endpoint, method, ipAddress, statusCode, userAgent]
    );
  } catch (e) {
    console.error('Error logging API key activity:', e);
  }
}

export async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  // 1. Check for global panic switch
  if (await isGlobalApiPanicked()) {
    return res.status(503).json({});
  }

  if (!apiKey) {
    return next(); // Proceed to check for token if no API key
  }

  try {
    const { query } = await import('./database.js');
    const crypto = await import('crypto');
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const result = await query(
      'SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role, u.permissions as user_permissions ' +
      'FROM api_keys a ' +
      'JOIN users u ON a.user_id = u.id ' +
      'WHERE a.key_hash = $1',
      [apiKeyHash]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    const keyData = result.rows[0];

    if (keyData.status !== 'active') {
      return res.status(403).json({});
    }

    // --- Access Level Enforcement ---
    if (keyData.access_level === 'read-only') {
      if (req.method !== 'GET') {
        return res.status(403).json({ 
          error: 'Read-only access: This API key is not authorized for write operations.' 
        });
      }
    } else if (keyData.access_level !== 'read-write') {
      // If it's not read-only and not read-write, block it for safety
      return res.status(403).json({});
    }

    // --- Rate Limiting ---
    const limit = keyData.rate_limit || 60;
    const usage = apiKeyUsage.get(keyData.id) || { count: 0 };

    if (usage.count >= limit) {
      return res.status(429).json({
        error: 'Too many requests'
      });
    }

    // Increment usage
    apiKeyUsage.set(keyData.id, { count: usage.count + 1 });

    // Update last used info and IP
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP, last_ip = $1 WHERE id = $2',
      [clientIp, keyData.id]
    );

    // Attach key data to request object
    req.apiKey = keyData;
    req.user = {
      id: keyData.user_id,
      name: keyData.user_name,
      email: keyData.user_email,
      role: keyData.user_role,
      permissions: typeof keyData.user_permissions === 'string' ? JSON.parse(keyData.user_permissions) : (keyData.user_permissions || {}),
      apiKeyAccess: keyData.access_level
    };

    // Log activity after response finishes
    const userAgent = req.headers['user-agent'] || 'Unknown';
    res.on('finish', () => {
      logApiKeyActivity(keyData.id, req.originalUrl, req.method, clientIp, res.statusCode, userAgent);
    });

    next();
  } catch (error) {
    console.error('API Key auth error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

export async function authenticateToken(req, res, next) {
  // If already authenticated via API key, skip token check
  if (req.user) return next();

  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query.token) {
    token = req.query.token;
  }


  if (!token) {
    console.log('authenticateToken - No token, returning 401');
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('authenticateToken - Invalid token, returning 403');
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Check if token has been blacklisted (silently terminated session)
  try {
    const { query } = await import('./database.js');
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const blacklisted = await query('SELECT id FROM token_blacklist WHERE token_hash = $1', [tokenHash]);
    if (blacklisted.rows.length > 0) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Fetch latest role, name, email and active status from DB
    const userResult = await query('SELECT name, email, role, permissions, is_active FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    const dbUser = userResult.rows[0];
    
    // Check if user is active
    if (dbUser.is_active === false) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    req.user = {
      ...decoded,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      permissions: typeof dbUser.permissions === 'string' ? JSON.parse(dbUser.permissions) : (dbUser.permissions || {})
    };

    // Session Monitoring: Auto-rehydrate or update session
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    const currentPage = req.headers['x-current-page'] || 'Apps';
    const loginTime = decoded.iat ? new Date(decoded.iat * 1000) : new Date();

    await query(`
      INSERT INTO active_sessions (user_id, username, role, token_hash, ip_address, device_info, last_page, login_time, last_activity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (token_hash) DO UPDATE SET 
        last_activity = NOW(),
        last_page = $7,
        ip_address = $5,
        device_info = $6
    `, [req.user.id, req.user.name, req.user.role, tokenHash, ipAddress, deviceInfo, currentPage, loginTime]);

  } catch (error) {
    console.error('Auth middleware DB error:', error);
    // Continue with JWT info if DB fails
    req.user = decoded;
  }

  next();
}

export function requireApiKeyAccess(level) {
  return (req, res, next) => {
    if (req.user && req.user.apiKeyAccess) {
      if (level === 'read-write' && req.user.apiKeyAccess === 'read-only') {
        return res.status(403).json({ error: 'API key has read-only access' });
      }
    }
    next();
  };
}

export function autoRequireApiKeyAccess(req, res, next) {
  // Only enforce if authenticated via API key
  if (req.user && req.user.apiKeyAccess) {
    if (req.user.apiKeyAccess === 'read-only' && req.method !== 'GET') {
      return res.status(403).json({ error: 'API key has read-only access for non-GET requests' });
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRoleLower = req.user.role?.toLowerCase();
    const authorized = roles.some(role => role.toLowerCase() === userRoleLower);

    if (!authorized) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}


