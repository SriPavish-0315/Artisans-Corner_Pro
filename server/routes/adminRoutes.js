const express = require('express');
const router = express.Router();
const {
  getAdminSummary,
  getAllUsers,
  toggleUserStatus,
  getAllStores,
  updateStoreStatus,
  getAllOrders
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin); // Protect all admin routes

router.get('/summary', getAdminSummary);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/stores', getAllStores);
router.put('/stores/:id/status', updateStoreStatus);
router.get('/orders', getAllOrders);

module.exports = router;
