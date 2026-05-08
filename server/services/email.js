// Email service placeholder - not used currently
// Kept for future use if OTP is re-enabled

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateOTP };
