const express = require('express');
const router = express.Router();
const {
  createStore,
  getMyStore,
  updateStore,
  getSellerDashboard
} = require('../controllers/storeController');
const { protect, seller } = require('../middleware/authMiddleware');

router.post('/', protect, createStore);
router.get('/mystore', protect, seller, getMyStore);
router.put('/mystore', protect, seller, updateStore);
router.get('/dashboard', protect, seller, getSellerDashboard);

module.exports = router;
