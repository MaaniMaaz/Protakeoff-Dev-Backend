const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { sendOrderConfirmationEmail } = require('./utils/email');

dotenv.config();

// Test order data
const testOrder = {
  _id: 'test-order-123',
  userEmail: 'test@example.com',
  userName: 'Test User',
  items: [
    {
      takeoffId: 'takeoff-1',
      title: 'Test Takeoff 1',
      price: 29.99,
      files: [
        {
          filename: 'test-file-1.pdf',
          originalName: 'Test File 1.pdf',
          cloudinaryUrl: 'https://res.cloudinary.com/example/raw/upload/test-file-1.pdf',
          size: 1024000
        },
        {
          filename: 'test-file-2.pdf',
          originalName: 'Test File 2.pdf',
          cloudinaryUrl: 'https://res.cloudinary.com/example/raw/upload/test-file-2.pdf',
          size: 2048000
        }
      ]
    },
    {
      takeoffId: 'takeoff-2',
      title: 'Test Takeoff 2',
      price: 49.99,
      files: [
        {
          filename: 'test-file-3.pdf',
          originalName: 'Test File 3.pdf',
          cloudinaryUrl: 'https://res.cloudinary.com/example/raw/upload/test-file-3.pdf',
          size: 1536000
        }
      ]
    }
  ],
  paymentIntentId: 'pi_test_123',
  amount: 79.98,
  status: 'paid',
  createdAt: new Date()
};

const testUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com'
};

async function testOrderEmail() {
  try {
    console.log('Testing order confirmation email...');
    console.log('Email configuration:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' : 'NOT SET');
    console.log('SMTP_FROM:', process.env.SMTP_FROM);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ Email configuration missing! Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
      return;
    }
    
    const result = await sendOrderConfirmationEmail(testOrder, testUser);
    
    if (result) {
      console.log('✅ Order confirmation email sent successfully!');
      console.log('📧 Check the inbox of:', testUser.email);
    } else {
      console.log('❌ Failed to send order confirmation email');
    }
  } catch (error) {
    console.error('❌ Error testing order email:', error);
  }
}

// Run the test
testOrderEmail(); 