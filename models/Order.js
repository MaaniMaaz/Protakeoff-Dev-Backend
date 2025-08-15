const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userName: { type: String },
  items: [
    {
      takeoffId: String,
      title: String,
      price: Number,
      generalContractor: {
        email: String,
        phone: String
      },
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
  originalAmount: { type: Number }, // Amount before discount
  discountAmount: { type: Number, default: 0 }, // Discount amount
  promoCode: {
    id: String,
    code: String,
    description: String,
    discountType: String,
    discountValue: Number
  },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema); 