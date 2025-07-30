const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userName: { type: String },
  items: [
    {
      takeoffId: String,
      title: String,
      price: Number,
      blueprintUrl: String,
      files: [
        {
          filename: String,
          originalName: String,
          cloudinaryUrl: String,
          size: Number
        }
      ]
    }
  ],
  paymentIntentId: { type: String },
  amount: { type: Number },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema); 