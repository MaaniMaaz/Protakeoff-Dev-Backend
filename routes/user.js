const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Get all users (admin only)
router.get('/', auth, userController.getAllUsers);

// Get user by JWT (profile)
router.get('/me', auth, userController.getUserByJWT);

// Get user by ID (admin or self)
router.get('/:id', auth, userController.getUserByID);

// Update user profile (self)
router.put('/me', [
  auth,
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('company').optional().notEmpty(),
  body('phone').optional(),
  body('address.street').optional(),
  body('address.city').optional(),
  body('address.state').optional(),
  body('address.zipCode').optional()
], userController.updateUserProfile);

module.exports = router; 