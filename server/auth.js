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

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getSecret(),
    { expiresIn: '7d' }
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
      // Silent termination — just return 401 like a normal expired session
      return res.status(401).json({ error: 'Session expired' });
    }

    // Token is valid — update last_activity and last_page in active_sessions
    const currentPage = req.headers['x-current-page'];
    if (currentPage) {
      await query(
        'UPDATE active_sessions SET last_activity = NOW(), last_page = $1 WHERE token_hash = $2',
        [currentPage, tokenHash]
      );
    } else {
      await query(
        'UPDATE active_sessions SET last_activity = NOW() WHERE token_hash = $1',
        [tokenHash]
      );
    }
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // Don't block on DB errors — continue with the request
  }

  req.user = decoded;

  // Fetch latest permissions from DB
  try {
    const { query } = await import('./database.js');
    const result = await query('SELECT role, permissions FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length > 0) {
      const userDoc = result.rows[0];
      req.user.role = userDoc.role;
      req.user.name = userDoc.name;
      // Ensure permissions are an object
      req.user.permissions = typeof userDoc.permissions === 'string'
        ? JSON.parse(userDoc.permissions)
        : (userDoc.permissions || {});
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
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


