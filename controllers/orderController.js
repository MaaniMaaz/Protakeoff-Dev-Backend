const Order = require('../models/Order');
const User = require('../models/User');

// Get all transactions for all users (admin only)
const auth = require('../middleware/auth');
exports.getAllTransactions =    async (req, res) => {
  try {
    // Get all users
    const users = await User.find({}, '-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    // For each user, get their orders
    const userTransactions = await Promise.all(users.map(async (user) => {
      const orders = await Order.find({ userEmail: user.email }).sort({ createdAt: -1 });
      return {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          phone: user.phone,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        transactions: orders.map(order => ({
          _id: order._id,
          items: order.items,
          amount: order.amount,
          status: order.status,
          createdAt: order.createdAt,
        }))
      };
    }));
    res.json({ success: true, data: userTransactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
