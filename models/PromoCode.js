const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  discountType: { 
    type: String, 
    required: true, 
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  maxDiscount: { 
    type: Number,
    default: null // Maximum discount amount for percentage discounts
  },
  minimumOrderAmount: { 
    type: Number, 
    default: 0 
  },
  maxUsage: { 
    type: Number, 
    default: null // null means unlimited
  },
  currentUsage: { 
    type: Number, 
    default: 0 
  },
  validFrom: { 
    type: Date, 
    default: Date.now 
  },
  validUntil: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: String, 
    default: 'admin' 
  }
});

// Index for efficient queries
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, validUntil: 1 });

// Virtual for checking if promo code is valid
promoCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (this.maxUsage === null || this.currentUsage < this.maxUsage);
});

// Method to validate promo code
promoCodeSchema.methods.validatePromoCode = function(orderAmount) {
  if (!this.isValid) {
    return { valid: false, message: 'Promo code is not valid or has expired' };
  }
  
  if (orderAmount < this.minimumOrderAmount) {
    return { 
      valid: false, 
      message: `Minimum order amount of $${this.minimumOrderAmount} required` 
    };
  }
  
  return { valid: true };
};

// Method to calculate discount
promoCodeSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }
  
  return Math.min(discount, orderAmount); // Don't discount more than order amount
};

module.exports = mongoose.model('PromoCode', promoCodeSchema); 