import express from 'express';
import { query } from '../database.js';
import { generateToken, hashPassword, comparePassword } from '../auth.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Register student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const existingResult = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (existingResult.rows.length > 0) {
      const existingUser = existingResult.rows[0];

      // If the user exists and is already verified, block registration
      if (existingUser.is_verified) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // If the user exists but is NOT verified, we allow "re-registration"
      // This acts as a resend verification mechanism and allows correcting name/password
      console.log(`🔄 Re-registration attempt for unverified email: ${email}`);

      const hashedPassword = await hashPassword(password);
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');

      await query(`
        UPDATE users 
        SET name = $1, password = $2, verification_token = $3, created_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [name, hashedPassword, verificationToken, existingUser.id]);

      try {
        const { sendVerificationEmail } = await import('../email.js');
        const emailResult = await sendVerificationEmail(email.toLowerCase(), name, verificationToken);
        if (!emailResult.success) {
          console.error('❌ Failed to resend verification email:', emailResult.error);
        } else {
          console.log('✅ Verification email resent successfully');
        }
      } catch (emailError) {
        console.error('❌ Failed to resend verification email (exception):', emailError.message);
      }

      return res.json({
        success: true,
        message: 'Registration updated. A new verification email has been sent to your inbox.'
      });
    }

    // Determine role based on email or admin key
    let userRole = 'Student';
    const isAdminEmail = email.toLowerCase() === 'admin@lyceum.com';

    if (isAdminEmail) {
      userRole = 'Admin';
    } else if (adminKey) {
      // Validate admin key
      const validAdminKey = process.env.ADMIN_REGISTRATION_KEY;
      if (!validAdminKey) {
        return res.status(500).json({ error: 'Admin registration is not configured on this server' });
      }
      if (adminKey === validAdminKey) {
        userRole = 'Admin';
      } else {
        return res.status(403).json({ error: 'Invalid admin registration key' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token (skip for admins)
    const crypto = await import('crypto');
    const isAdmin = userRole === 'Admin';
    const verificationToken = isAdmin ? null : crypto.randomBytes(32).toString('hex');

    // Define default student permissions
    const studentPermissions = {
      'LMS': { read: true },
      'dashboard': { read: true },
      'Profile': { read: true, update: true }
    };

    const defaultChecklist = [
      { id: 0, text: 'Documents', completed: false, type: 'checkbox' },
      { id: 1, text: 'Submit High School Transcript', completed: false, type: 'checkbox' },
      { id: 2, text: 'Complete Personal Statement', completed: false, type: 'checkbox' },
      { id: 3, text: 'Pay Application Fee', completed: false, type: 'checkbox' },
      { id: 4, text: 'Submit Letters of Recommendation', completed: false, type: 'checkbox' },
      { id: 5, text: 'Pay SEVIS Fee', completed: false, type: 'checkbox' }
    ];

    // Create user (auto-verify admins)
    const userResult = await query(`
      INSERT INTO users (name, email, password, role, permissions, is_verified, verification_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, permissions, must_reset_password
    `, [
      name,
      email.toLowerCase(),
      hashedPassword,
      userRole,
      JSON.stringify(userRole === 'Student' ? studentPermissions : {}),
      isAdmin,
      verificationToken
    ]);

    const user = userResult.rows[0];

    // Create contact
    const contactId = `LA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(user.id).padStart(3, '0')}`;

    await query(`
      INSERT INTO contacts (user_id, name, email, contact_id, department, major, notes, checklist, activity_log, recorded_sessions)
      VALUES ($1, $2, $3, $4, 'Unassigned', 'Unassigned', $5, $6, '[]', '[]')
      RETURNING *
    `, [
      user.id,
      name,
      email.toLowerCase(),
      contactId,
      `Student registered on ${new Date().toLocaleDateString()}.`,
      JSON.stringify(defaultChecklist) // Apply to all contacts created via registration
    ]);

    // Send verification email (skip for admins)
    if (!isAdmin) {
      try {
        const { sendVerificationEmail } = await import('../email.js');
        const emailResult = await sendVerificationEmail(email, name, verificationToken);
        if (!emailResult.success) {
          console.error('❌ Failed to send verification email during registration:', emailResult.error);
        } else {
          console.log('✅ Registration verification email sent successfully');
        }
      } catch (emailError) {
        // Log but don't fail registration if email fails
        console.error('❌ Failed to send verification email (exception):', emailError.message);
        console.log('User can still verify later or admin can manually verify');
      }
    }

    res.json({
      success: true,
      message: isAdmin
        ? 'Admin registration successful. You can now log in.'
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
      console.warn(`🔍 Login attempt failed: User not found (${email})`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      console.warn(`🔍 Login attempt failed: Incorrect password for ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check verification status
    if (user.is_verified === false) {
      console.warn(`🔍 Login attempt blocked: Email not verified for ${email}`);
      return res.status(403).json({ error: 'Email not verified. Please check your inbox.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    console.log(`✅ Successful login: ${email} (Role: ${user.role})`);

    // Format response
    const safeUser = {
      ...userWithoutPassword,
      permissions: typeof userWithoutPassword.permissions === 'string'
        ? JSON.parse(userWithoutPassword.permissions)
        : userWithoutPassword.permissions,
      mustResetPassword: userWithoutPassword.must_reset_password
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
      'SELECT id, name, email, role, permissions, must_reset_password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const safeUser = {
      ...user,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
      mustResetPassword: user.must_reset_password
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
      'UPDATE users SET password = $1, must_reset_password = false WHERE id = $2',
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
      'SELECT COUNT(*) FROM password_reset_tokens WHERE email = $1 AND created_at > $2',
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
        INSERT INTO password_reset_tokens (email, token, expires_at)
        VALUES ($1, $2, $3)
      `, [email.toLowerCase(), resetToken, expiresAt]);

      // Send reset email
      const { sendPasswordResetEmail } = await import('../email.js');
      const emailResult = await sendPasswordResetEmail(email, user.name, resetToken);
      if (!emailResult.success) {
        console.error('❌ Failed to send password reset email:', emailResult.error);
      } else {
        console.log('✅ Password reset email sent successfully');
      }
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
      WHERE token = $1 AND used = FALSE AND expires_at > NOW()
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
      SET password = $1, must_reset_password = false
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

// Create User (Admin Only)
router.post('/create-user', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, permissions } = req.body;

    // Check if requester is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // Validate role
    if (!['Admin', 'Staff', 'Student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Admin, Staff, or Student' });
    }

    // Check if user exists
    const existingResult = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate random password
    const crypto = await import('crypto');
    const temporaryPassword = crypto.randomBytes(8).toString('hex'); // 16 character password
    const hashedPassword = await hashPassword(temporaryPassword);

    // Define default student permissions
    const studentPermissions = {
      'LMS': { read: true },
      'dashboard': { read: true },
      'Profile': { read: true, update: true }
    };

    const defaultChecklist = [
      { id: 0, text: 'Documents', completed: false, type: 'checkbox' },
      { id: 1, text: 'Submit High School Transcript', completed: false, type: 'checkbox' },
      { id: 2, text: 'Complete Personal Statement', completed: false, type: 'checkbox' },
      { id: 3, text: 'Pay Application Fee', completed: false, type: 'checkbox' },
      { id: 4, text: 'Submit Letters of Recommendation', completed: false, type: 'checkbox' },
      { id: 5, text: 'Pay SEVIS Fee', completed: false, type: 'checkbox' }
    ];

    // Create user (auto-verified, must reset password on first login)
    const userResult = await query(`
      INSERT INTO users (name, email, password, role, permissions, is_verified, verification_token, must_reset_password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, role, permissions, must_reset_password
    `, [
      name,
      email.toLowerCase(),
      hashedPassword,
      role,
      JSON.stringify(role === 'Student' ? studentPermissions : (permissions || {})),
      true, // Auto-verified
      null, // No verification token needed
      true  // Must reset password on first login
    ]);

    const user = userResult.rows[0];

    // Create contact
    const contactId = `LA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(user.id).padStart(3, '0')}`;

    await query(`
      INSERT INTO contacts (user_id, name, email, contact_id, department, major, notes, checklist, activity_log, recorded_sessions)
      VALUES ($1, $2, $3, $4, 'Unassigned', 'Unassigned', $5, $6, '[]', '[]')
      RETURNING *
    `, [
      user.id,
      name,
      email.toLowerCase(),
      contactId,
      `${role} account created by admin on ${new Date().toLocaleDateString()}.`,
      JSON.stringify(defaultChecklist) // Apply to all contacts created by admin
    ]);

    res.json({
      success: true,
      user: {
        ...user,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
      },
      temporaryPassword // Return the password so admin can share it
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
