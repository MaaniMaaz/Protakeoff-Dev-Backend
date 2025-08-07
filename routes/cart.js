const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_BQokikJOvBiI2HlWgH4olfQ2'); // Set your Stripe test secret key in .env
const Order = require('../models/Order');
const Takeoff = require('../models/Takeoff');
const PromoCode = require('../models/PromoCode');
const { sendOrderConfirmationEmail } = require('../utils/email');

// POST /api/cart/checkout
router.post('/checkout', async (req, res) => {
  try {
    const { cart, user, paymentMethodId, promoCodeId } = req.body;
    if (!cart || !user || !paymentMethodId) {
      return res.status(400).json({ success: false, message: 'Missing cart, user, or payment info' });
    }
    
    // Calculate original total
    const originalAmount = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    
    // Apply promo code if provided
    let finalAmount = originalAmount;
    let discountAmount = 0;
    let promoCodeData = null;
    
    if (promoCodeId) {
      const promoCode = await PromoCode.findById(promoCodeId);
      if (promoCode && promoCode.isValid) {
        const validation = promoCode.validatePromoCode(originalAmount);
        if (validation.valid) {
          discountAmount = promoCode.calculateDiscount(originalAmount);
          finalAmount = originalAmount - discountAmount;
          promoCodeData = {
            id: promoCode._id,
            code: promoCode.code,
            description: promoCode.description,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue
          };
          
          // Increment usage count
          await PromoCode.findByIdAndUpdate(promoCodeId, {
            $inc: { currentUsage: 1 }
          });
        }
      }
    }
    
    // Create Stripe PaymentIntent with final amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // cents
      currency: 'usd',
      payment_method: paymentMethodId,
      payment_method_types: ['card'],
      confirm: true,
    });
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ success: false, message: 'Payment not successful' });
    }
    
    // Prepare order items with blueprint links
    const items = await Promise.all(cart.map(async (item) => {
      const takeoff = await Takeoff.findById(item.id);
      // Increment download count
      if (takeoff) {
        takeoff.downloadCount = (takeoff.downloadCount || 0) + 1;
        await takeoff.save();
      }
      return {
        takeoffId: item.id,
        title: item.title,
        price: item.price,
        files: takeoff && takeoff.files ? takeoff.files.map(file => ({
          filename: file.filename,
          originalName: file.originalName,
          cloudinaryUrl: file.cloudinaryUrl,
          size: file.size
        })) : [],
        blueprintUrl: takeoff && takeoff.files && takeoff.files[0]?.cloudinaryUrl ? takeoff.files[0].cloudinaryUrl : '', // Keep for backward compatibility
      };
    }));
    
    // Save order with promo code information
    const order = new Order({
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      items,
      paymentIntentId: paymentIntent.id,
      amount: finalAmount,
      originalAmount,
      discountAmount,
      promoCode: promoCodeData,
      status: 'paid',
    });
    await order.save();
    
    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(order, user);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order if email fails
    }
    
    return res.status(200).json({ success: true, message: 'Order placed successfully', order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Checkout failed', error: err.message });
  }
});

// Get all orders for a user
router.get('/orders/user/:email', async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
  }
});

// Get a specific order by ID
router.get('/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: err.message });
  }
});

module.exports = router; 