const nodemailer = require('nodemailer');
const dotenv = require('dotenv')

dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' : undefined);
// Use Gmail SMTP with host/port/secure/tls for best compatibility
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
    ciphers: 'SSLv3',
  },
  debug: false,
  logger: false,
});

// Optionally verify connection on startup
transporter.verify().then(() => {
  console.log('Nodemailer: Email server is ready');
}).catch((err) => {
  console.error('Nodemailer: Email server connection error:', err);
});

async function sendEmail({ to, subject, html, text, replyTo }) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text,
    replyTo,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'High',
      'X-Contact-Form': 'ProTakeoff Backend',
    },
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail }; 