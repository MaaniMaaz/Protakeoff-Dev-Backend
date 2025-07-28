const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all users (no auth)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    res.json({ success: true, data: { users } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get user by JWT (profile)
exports.getUserByJWT = async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get user by ID (admin or self)
exports.getUserByID = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(req.params.id, '-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Update user profile (self)
exports.updateUserProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const updates = req.body;
    updates.updatedAt = new Date();
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, select: '-password -verificationToken -resetPasswordToken -resetPasswordExpires' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 