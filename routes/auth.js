const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('company').notEmpty(),
  body('address.street').notEmpty(),
  body('address.city').notEmpty(),
  body('address.state').notEmpty(),
  body('address.zipCode').notEmpty(),
], authController.register);

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty(),
], authController.login);

// Admin Login
router.post('/admin-login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const { email, password } = req.body;
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }
    
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access denied' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company
        },
        token
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

router.get('/verify-email', authController.verifyEmail);

module.exports = router; 