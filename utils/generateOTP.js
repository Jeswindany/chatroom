const crypto = require("crypto");

function generateOTP() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(crypto.randomBytes(6))
    .map((b) => chars[b % chars.length])
    .join("");
}

module.exports = generateOTP;
