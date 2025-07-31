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

// Function to send order confirmation email
async function sendOrderConfirmationEmail(order, user) {
  try {
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generate items HTML
    const itemsHtml = order.items.map(item => {
      const filesList = item.files && item.files.length > 0 
        ? item.files.map(file => `<li><a href="${file.cloudinaryUrl}" target="_blank" style="color: #007bff; text-decoration: none;">${file.originalName}</a></li>`).join('')
        : '<li>No files available</li>';
      
      return `
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f9f9f9;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">${item.title}</h3>
          <p style="margin: 4px 0; color: #666;">Price: $${item.price.toFixed(2)}</p>
          <div style="margin-top: 12px;">
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">Download Files:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              ${filesList}
            </ul>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - ProTakeoff</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: white; padding: 20px; border: 1px solid #e0e0e0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; }
          .order-summary { background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .total { font-size: 18px; font-weight: bold; color: #007bff; }
          .download-section { background-color: #e7f3ff; padding: 16px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Order Confirmation</h1>
            <p style="margin: 10px 0 0 0;">Thank you for your purchase!</p>
          </div>
          
          <div class="content">
            <p>Dear ${user.firstName} ${user.lastName},</p>
            
            <p>Your order has been successfully processed. Here are the details:</p>
            
            <div class="order-summary">
              <h2 style="margin: 0 0 16px 0; color: #333;">Order Details</h2>
              <p><strong>Order ID:</strong> ${order._id}</p>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Paid</span></p>
            </div>
            
            <h2 style="color: #333; margin: 24px 0 16px 0;">Items Purchased</h2>
            ${itemsHtml}
            
            <div class="order-summary">
              <p class="total">Total Amount: $${order.amount.toFixed(2)}</p>
            </div>
            
            <div class="download-section">
              <h3 style="margin: 0 0 12px 0; color: #333;">Download Your Files</h3>
              <p style="margin: 0; color: #666;">Click on the file links above to download your purchased takeoff files. The links will remain active for your convenience.</p>
            </div>
            
            <p>If you have any questions about your order, please don't hesitate to contact our support team.</p>
            
            <p>Thank you for choosing ProTakeoff!</p>
          </div>
          
          <div class="footer">
            <p style="margin: 0; color: #666; font-size: 14px;">
              © 2024 ProTakeoff. All rights reserved.<br>
              This is an automated email, please do not reply directly to this message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Order Confirmation - ProTakeoff

Dear ${user.firstName} ${user.lastName},

Your order has been successfully processed. Here are the details:

Order ID: ${order._id}
Order Date: ${orderDate}
Status: Paid

Items Purchased:
${order.items.map(item => `
- ${item.title}
  Price: $${item.price.toFixed(2)}
  Files: ${item.files ? item.files.map(f => f.originalName).join(', ') : 'No files available'}
`).join('')}

Total Amount: $${order.amount.toFixed(2)}

Download Your Files:
${order.items.map(item => 
  item.files ? item.files.map(f => `- ${f.originalName}: ${f.cloudinaryUrl}`).join('\n') : '- No files available'
).join('\n')}

If you have any questions about your order, please don't hesitate to contact our support team.

Thank you for choosing ProTakeoff!

© 2024 ProTakeoff. All rights reserved.
    `;

    await sendEmail({
      to: user.email,
      subject: `Order Confirmation - Order #${order._id}`,
      html,
      text
    });

    console.log(`Order confirmation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
}

module.exports = { sendEmail, sendOrderConfirmationEmail }; 