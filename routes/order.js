const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const orderController = require('../controllers/orderController');


router.get('/transactions', orderController.getAllTransactions);
router.post('/resend-email/:orderId', auth, orderController.resendOrderEmail);

module.exports = router;
