import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import './load_env.js';

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
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;

  // Fetch latest permissions from DB
  try {
    const { query } = await import('./database.js');
    const result = await query('SELECT role, permissions FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length > 0) {
      const userDoc = result.rows[0];
      req.user.role = userDoc.role;
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
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}


