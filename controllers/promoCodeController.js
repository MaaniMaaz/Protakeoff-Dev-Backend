const PromoCode = require('../models/PromoCode');

// Create a new promo code (admin only)
exports.createPromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderAmount,
      maxUsage,
      validFrom,
      validUntil,
      isActive
    } = req.body;

    // Check if promo code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Promo code already exists' 
      });
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderAmount: minimumOrderAmount || 0,
      maxUsage: maxUsage || null,
      validFrom: validFrom || new Date(),
      validUntil,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: 'admin'
    });

    await promoCode.save();

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      promoCode
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to create promo code',
      error: err.message
    });
  }
};

// Get all promo codes (admin only)
exports.getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      promoCodes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promo codes',
      error: err.message
    });
  }
};

// Get a specific promo code by ID
exports.getPromoCodeById = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }
    res.json({
      success: true,
      promoCode
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promo code',
      error: err.message
    });
  }
};

// Update a promo code (admin only)
exports.updatePromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderAmount,
      maxUsage,
      validFrom,
      validUntil,
      isActive
    } = req.body;

    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    // Check if new code conflicts with existing codes (excluding current one)
    if (code && code.toUpperCase() !== promoCode.code) {
      const existingCode = await PromoCode.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Promo code already exists'
        });
      }
    }

    // Update fields
    if (code) promoCode.code = code.toUpperCase();
    if (description !== undefined) promoCode.description = description;
    if (discountType !== undefined) promoCode.discountType = discountType;
    if (discountValue !== undefined) promoCode.discountValue = discountValue;
    if (maxDiscount !== undefined) promoCode.maxDiscount = maxDiscount;
    if (minimumOrderAmount !== undefined) promoCode.minimumOrderAmount = minimumOrderAmount;
    if (maxUsage !== undefined) promoCode.maxUsage = maxUsage;
    if (validFrom !== undefined) promoCode.validFrom = validFrom;
    if (validUntil !== undefined) promoCode.validUntil = validUntil;
    if (isActive !== undefined) promoCode.isActive = isActive;

    await promoCode.save();

    res.json({
      success: true,
      message: 'Promo code updated successfully',
      promoCode
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update promo code',
      error: err.message
    });
  }
};

// Delete a promo code (admin only)
exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }
    res.json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete promo code',
      error: err.message
    });
  }
};

// Validate and apply promo code (public endpoint)
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Promo code and order amount are required'
      });
    }

    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }

    // Validate the promo code
    const validation = promoCode.validatePromoCode(orderAmount);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Calculate discount
    const discount = promoCode.calculateDiscount(orderAmount);
    const finalAmount = orderAmount - discount;

    res.json({
      success: true,
      promoCode: {
        id: promoCode._id,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        maxDiscount: promoCode.maxDiscount
      },
      discount,
      finalAmount,
      originalAmount: orderAmount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate promo code',
      error: err.message
    });
  }
};

// Increment usage count when promo code is used
exports.incrementUsage = async (promoCodeId) => {
  try {
    await PromoCode.findByIdAndUpdate(promoCodeId, {
      $inc: { currentUsage: 1 }
    });
  } catch (err) {
    console.error('Failed to increment promo code usage:', err);
  }
}; 