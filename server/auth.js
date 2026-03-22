import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export async function authenticateToken(req, res, next) {
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

    // Fetch latest role, name and email from DB
    const userResult = await query('SELECT name, email, role, permissions FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    const dbUser = userResult.rows[0];
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


