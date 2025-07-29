const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Validation middleware for contact form submission
const validateContactSubmission = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters')
];

// Public routes
router.post('/submit', validateContactSubmission, contactController.submitContact);

// Admin routes (no authentication required)
router.get('/admin/all', contactController.getAllContacts);
router.get('/admin/stats', contactController.getContactStats);
router.get('/admin/:id', contactController.getContactById);
router.patch('/admin/:id/status', contactController.updateContactStatus);
router.delete('/admin/:id', contactController.deleteContact);

module.exports = router;