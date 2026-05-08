const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'FIFA 2026 Predictions <onboarding@resend.dev>';

/**
 * Send a verification OTP email via Resend
 */
function sendOTP(toEmail, otp, name) {
  return new Promise((resolve, reject) => {
    if (!RESEND_API_KEY) {
      console.log(`[DEV MODE] OTP for ${toEmail}: ${otp}`);
      return resolve({ id: 'dev-mode', otp });
    }

    const payload = JSON.stringify({
      from: FROM_EMAIL,
      to: [toEmail],
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
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || 'Email send failed'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendOTP, generateOTP };
