const nodemailer = require('nodemailer');
const dotenv = require('dotenv')

dotenv.config();

console.log('EMAIL_USER:', dotenv.config().parsed.EMAIL_USER);
console.log('EMAIL_PASSWORD:', dotenv.config().parsed.EMAIL_PASSWORD ? '***' : undefined);
// Use Gmail SMTP with host/port/secure/tls for best compatibility
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: dotenv.config().parsed.EMAIL_USER,
    pass: dotenv.config().parsed.EMAIL_PASSWORD,
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
    from: dotenv.config().parsed.SMTP_FROM || dotenv.config().parsed.EMAIL_USER,
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