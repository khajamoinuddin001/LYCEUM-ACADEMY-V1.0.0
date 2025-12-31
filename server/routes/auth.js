import express from 'express';
import { query } from '../database.js';
import { generateToken, hashPassword, comparePassword } from '../auth.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Register student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingResult = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token (skip for admin@lyceum.com)
    const crypto = await import('crypto');
    const isAdminEmail = email.toLowerCase() === 'admin@lyceum.com';
    const verificationToken = isAdminEmail ? null : crypto.randomBytes(32).toString('hex');

    // Create user (auto-verify admin@lyceum.com)
    const userResult = await query(`
      INSERT INTO users (name, email, password, role, permissions, is_verified, verification_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, permissions, "mustResetPassword"
    `, [name, email.toLowerCase(), hashedPassword, isAdminEmail ? 'Admin' : 'Student', JSON.stringify({}), isAdminEmail, verificationToken]);

    const user = userResult.rows[0];

    // Create contact
    const contactId = `LA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(user.id).padStart(3, '0')}`;

    await query(`
      INSERT INTO contacts ("userId", name, email, "contactId", department, major, notes, checklist, "activityLog", "recordedSessions")
      VALUES ($1, $2, $3, $4, 'Unassigned', 'Unassigned', $5, '[]', '[]', '[]')
      RETURNING *
    `, [
      user.id,
      name,
      email.toLowerCase(),
      contactId,
      `Student registered on ${new Date().toLocaleDateString()}.`
    ]);

    // Send verification email (skip for admin@lyceum.com)
    if (!isAdminEmail) {
      const { sendVerificationEmail } = await import('../email.js');
      await sendVerificationEmail(email, name, verificationToken);
    }

    res.json({
      success: true,
      message: isAdminEmail
        ? 'Registration successful. You can now log in.'
        : 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with token
    const result = await query('SELECT * FROM users WHERE verification_token = $1', [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = result.rows[0];

    // Update user verification status
    await query(`
      UPDATE users 
      SET is_verified = true, verification_token = NULL 
      WHERE id = $1
    `, [user.id]);

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check verification status
    if (user.is_verified === false) {
      return res.status(403).json({ error: 'Email not verified. Please check your inbox.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    // Format response
    const safeUser = {
      ...userWithoutPassword,
      permissions: typeof userWithoutPassword.permissions === 'string'
        ? JSON.parse(userWithoutPassword.permissions)
        : userWithoutPassword.permissions,
      mustResetPassword: userWithoutPassword.mustResetPassword
    };

    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, permissions, "mustResetPassword" FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const safeUser = {
      ...user,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
      mustResetPassword: user.mustResetPassword
    };

    res.json({ user: safeUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await query(
      'UPDATE users SET password = $1, "mustResetPassword" = false WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot Password - Request reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check rate limiting - max 60 requests per hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await query(
      'SELECT COUNT(*) FROM password_reset_tokens WHERE email = $1 AND "createdAt" > $2',
      [email.toLowerCase(), oneHourAgo]
    );

    if (parseInt(recentRequests.rows[0].count) >= 60) {
      return res.status(429).json({
        error: 'Too many reset requests. Please try again later.'
      });
    }

    // Check if user exists
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Generate secure random token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in database
      await query(`
        INSERT INTO password_reset_tokens (email, token, "expiresAt")
        VALUES ($1, $2, $3)
      `, [email.toLowerCase(), resetToken, expiresAt]);

      // Send reset email
      const { sendPasswordResetEmail } = await import('../email.js');
      await sendPasswordResetEmail(email, user.name, resetToken);
    }

    // Always return success message (security best practice)
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset Password - Validate token and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find valid token
    const tokenResult = await query(`
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 AND used = FALSE AND "expiresAt" > NOW()
    `, [token]);

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetToken = tokenResult.rows[0];
    const email = resetToken.email;

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await query(`
      UPDATE users 
      SET password = $1, "mustResetPassword" = 0
      WHERE email = $2
    `, [hashedPassword, email]);

    // Mark token as used
    await query(`
      UPDATE password_reset_tokens 
      SET used = TRUE 
      WHERE token = $1
    `, [token]);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
