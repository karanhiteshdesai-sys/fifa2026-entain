// Email service - placeholder for future OTP implementation
// Will be enabled once IT enables SMTP AUTH for Outlook

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateOTP };
