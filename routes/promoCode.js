const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCodeController');
const auth = require('../middleware/auth');

// Admin routes (protected)
router.post('/', auth, promoCodeController.createPromoCode);
router.get('/', auth, promoCodeController.getAllPromoCodes);
router.get('/:id', auth, promoCodeController.getPromoCodeById);
router.put('/:id', auth, promoCodeController.updatePromoCode);
router.delete('/:id', auth, promoCodeController.deletePromoCode);

// Public route for validating promo codes
router.post('/validate', promoCodeController.validatePromoCode);

module.exports = router; 