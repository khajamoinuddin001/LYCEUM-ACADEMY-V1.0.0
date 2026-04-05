import './load_env.js';
import nodemailer from "nodemailer";

export const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;

  console.log(`🔍 [Email] Configuring transporter: host=${host}, port=${port}, user=${user}, from=${from}`);

  if (!host || !user || !pass) {
    console.warn("⚠️ SMTP credentials not fully configured. Email sending will likely fail.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Useful for some hosting providers
    },
  });

  return { transporter, from: from || user };
};

// Send password reset email
export const sendPasswordResetEmail = async (email, name, resetToken) => {
  console.log(`📧 Attempting to send password reset email to: ${email}`);
  try {
    const { transporter, from } = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: from,
      to: email,
      subject: 'Reset Your Lyceum Academy Password',
      // ... (rest of mail options remain same)
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2A6F97 0%, #1e4d6b 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Lyceum Academy</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${name},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        You requested to reset your password for your Lyceum Academy account. Click the button below to set a new password:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${resetUrl}" style="background-color: #2A6F97; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #2A6F97; font-size: 14px; word-break: break-all; margin: 10px 0 30px 0;">
                        ${resetUrl}
                      </p>
                      
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                          <strong>⏰ This link expires in 1 hour.</strong>
                        </p>
                      </div>
                      
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                        Best regards,<br>
                        <strong>Lyceum Academy Team</strong>
                      </p>
                      <p style="color: #cccccc; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Lyceum Academy. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nYou requested to reset your password for your Lyceum Academy account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this password reset, please ignore this email. Your password will remain unchanged.\n\nBest regards,\nLyceum Academy Team`.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send verification email
export const sendVerificationEmail = async (email, name, token) => {
  console.log(`📧 Attempting to send verification email to: ${email}`);
  try {
    const { transporter, from } = createTransporter();
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: from,
      to: email,
      subject: 'Verify Your Email - Lyceum Academy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2A6F97 0%, #1e4d6b 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Lyceum Academy</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${name},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Thanks for signing up for Lyceum Academy! Please click the button below to verify your email address and activate your account:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${verifyUrl}" style="background-color: #2A6F97; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Verify Email</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #2A6F97; font-size: 14px; word-break: break-all; margin: 10px 0 30px 0;">
                        ${verifyUrl}
                      </p>
                      
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        If you didn't create an account with Lyceum Academy, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                        Best regards,<br>
                        <strong>Lyceum Academy Team</strong>
                      </p>
                      <p style="color: #cccccc; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Lyceum Academy. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nThanks for signing up for Lyceum Academy!\n\nPlease verify your email address by clicking the link below:\n${verifyUrl}\n\nIf you didn't create an account with Lyceum Academy, please ignore this email.\n\nBest regards,\nLyceum Academy Team`.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    console.log('🔍 Testing email configuration...');
    const { transporter } = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message || error);
    return false;
  }
};

// Send announcement email
export const sendAnnouncementEmail = async (email, name, title, content, attachments = []) => {
  console.log(`📧 Attempting to send announcement email to: ${email} with ${attachments?.length || 0} attachments`);
  try {
    const { transporter, from } = createTransporter();

    const mailOptions = {
      from: from,
      to: email,
      subject: `Lyceum Academy: ${title}`,
      attachments: attachments.map(file => ({
        filename: file.originalname || file.filename,
        content: file.buffer || file.content,
        contentType: file.mimetype || file.contentType
      })),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2A6F97 0%, #1e4d6b 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Lyceum Academy</h1>
                      <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 14px;">Official Announcement</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">${title}</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${name},
                      </p>
                      <div style="color: #333333; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                        ${content}
                      </div>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #2A6F97; padding: 15px; margin: 20px 0;">
                        <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
                          You can also view this announcement and download any attachments by logging into your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #2A6F97; text-decoration: none; font-weight: bold;">Student Portal</a>.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                        Lyceum Academy Administration
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nAnnouncement: ${title}\n\n${content}\n\nView more in your Student Portal: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n\nLyceum Academy Administration`.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Announcement email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending announcement email:', error);
    return { success: false, error: error.message };
  }
};

// Send unlock account OTP email
export const sendUnlockOtpEmail = async (email, name, otp) => {
  console.log(`📧 Attempting to send unlock OTP email to: ${email}`);
  try {
    const { transporter, from } = createTransporter();

    const mailOptions = {
      from: from,
      to: email,
      subject: 'Security Alert: Account Locked - Lyceum Academy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Locked</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #e63946 0%, #ba2d38 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Lyceum Academy</h1>
                      <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 14px;">Security Notification</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Your Account Has Been Locked</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${name},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        For your security, your account has been locked due to multiple failed login attempts. To unlock your account, please use the following 6-digit verification code:
                      </p>
                      
                      <!-- OTP Code -->
                      <div style="background-color: #f8f9fa; border: 1px dashed #e63946; padding: 20px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e63946;">${otp}</span>
                      </div>
                      
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                          <strong>⏰ This code is valid for 15 minutes.</strong>
                        </p>
                      </div>
                      
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        If you did not attempt to log in, please contact our support team immediately.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                        Best regards,<br>
                        <strong>Lyceum Academy Security Team</strong>
                      </p>
                      <p style="color: #cccccc; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Lyceum Academy. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${name},\n\nYour Lyceum Academy account has been locked due to multiple failed login attempts.\n\nTo unlock your account, please use the following 6-digit verification code:\n\n${otp}\n\nThis code is valid for 15 minutes.\n\nIf you did not attempt to log in, please contact our support team immediately.\n\nBest regards,\nLyceum Academy Security Team`.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Unlock OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending unlock OTP email:', error);
    return { success: false, error: error.message };
  }
};
