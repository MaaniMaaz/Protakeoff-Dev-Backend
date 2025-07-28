const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const orderController = require('../controllers/orderController');


router.get('/transactions', orderController.getAllTransactions);

module.exports = router;
