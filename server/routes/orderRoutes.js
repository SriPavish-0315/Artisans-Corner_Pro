const express = require('express');
const router = express.Router();
const {
  createOrder,
  createStripePaymentIntent,
  verifyStripePaymentAndConfirmOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getSellerOrders
} = require('../controllers/orderController');
const { protect, seller } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.post('/create-payment-intent', protect, createStripePaymentIntent);
router.post('/verify-stripe-payment', protect, verifyStripePaymentAndConfirmOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/sellerorders', protect, seller, getSellerOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/status', protect, seller, updateOrderStatus);

module.exports = router;