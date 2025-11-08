// backend/src/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,              // ✅ STARTTLS port (recommended)
  secure: false,          // ✅ false for STARTTLS
  auth: {
    user: process.env.MAIL_USER,          // your Gmail address
    pass: process.env.MAIL_APP_PASSWORD,  // 16-char app password
  },
  tls: {
    rejectUnauthorized: true,
  },
  connectionTimeout: 15000,
  socketTimeout: 20000,
});

// ✅ Optional: verify once when the server starts
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email connection failed:', error.message);
  } else {
    console.log('📧 Mailer ready to send emails');
  }
});

module.exports = transporter;
