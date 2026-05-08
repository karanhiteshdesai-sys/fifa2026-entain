const nodemailer = require('nodemailer');

// Gmail SMTP configuration
const GMAIL_USER = process.env.GMAIL_USER || 'fifa2026et@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'jkdq zfnl muni pyrw';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

/**
 * Send a verification OTP email via Gmail SMTP
 */
async function sendOTP(toEmail, otp, name) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
  }

  const mailOptions = {
    from: `"FIFA 2026 Predictions" <${GMAIL_USER}>`,
    to: toEmail,
    subject: 'FIFA 2026 Predictions - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a2e; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; margin: 0;">FIFA 2026</h1>
          <p style="color: #00d4aa; font-size: 12px; font-weight: bold; margin: 4px 0;">ENTAIN PREDICTIONS</p>
        </div>
        <p style="color: #e0e0e0; font-size: 14px;">Hi ${name},</p>
        <p style="color: #e0e0e0; font-size: 14px;">Your verification code is:</p>
        <div style="background: #16213e; border: 1px solid #0f3460; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="color: #00d4aa; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #9e9e9e; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #0f3460; margin: 24px 0;" />
        <p style="color: #666; font-size: 11px; text-align: center;">Entain Internal - No real money involved</p>
      </div>
    `
  };

  const result = await transporter.sendMail(mailOptions);
  return result;
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendOTP, generateOTP };
