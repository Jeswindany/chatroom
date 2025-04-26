const nodemailer = require("nodemailer");

async function sendOTP(toEmail, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Chatroom App" <${process.env.EMAIL_USER}`,
    to: toEmail,
    subject: "Your OTP Code for Chatroom App",
    html: `<h2>Your OTP Code is:</h2> <h1>${otp}</h1> <p>Please enter it to verify your email.</p>`,
  };

  let info = await transporter.sendMail(mailOptions);
}

module.exports = sendOTP;
