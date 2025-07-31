const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { email, password, firstName, lastName, company, phone, address } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company,
      phone,
      address,
      verificationToken,
      isVerified: false
    });
    await user.save();
    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}&email=${email}`;
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Hello ${firstName},</p><p>Thank you for registering. Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p>`
    });
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Set token expiration based on remember me
    const tokenExpiry = rememberMe ? '30d' : '1h';
    const refreshTokenExpiry = rememberMe ? '60d' : '7d';
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: tokenExpiry });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: refreshTokenExpiry });
    
    user.lastLogin = new Date();
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company
        },
        token,
        refreshToken
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return res.status(200).json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}&email=${email}`;
    
    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${user.firstName},</p>
        <p>You requested a password reset for your ProTakeoff.ai account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The ProTakeoff.ai Team</p>
      `
    });

    return res.status(200).json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { token, email, password } = req.body;
    
    // Hash the token to compare with stored hash
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      email,
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) {
    return res.status(400).json({ success: false, message: 'Invalid verification link.' });
  }
  try {
    const user = await User.findOne({ email, verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 