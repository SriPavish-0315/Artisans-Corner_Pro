const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get admin platform analytics summary
// @route   GET /api/admin/summary
// @access  Private (Admin)
const getAdminSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalStores = await Store.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find({ isPaid: true });
    
    let totalGrossRevenue = 0;
    orders.forEach(order => {
      totalGrossRevenue += order.itemsPrice;
    });

    const totalPlatformCommission = totalGrossRevenue * 0.05;
    const totalSellerPayouts = totalGrossRevenue * 0.95;

    res.json({
      success: true,
      message: 'Admin summary analytics retrieved',
      data: {
        totalUsers,
        totalBuyers,
        totalSellers,
        totalStores,
        totalProducts,
        totalOrders,
        totalGrossRevenue,
        totalPlatformCommission,
        totalSellerPayouts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      message: 'Users list retrieved',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Toggle user status (Active/Suspended)
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${user.isActive ? 'Active' : 'Suspended'}`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get all stores
// @route   GET /api/admin/stores
// @access  Private (Admin)
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json({
      success: true,
      message: 'Stores list retrieved',
      data: stores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Update store status (Active/Disabled/Pending)
// @route   PUT /api/admin/stores/:id/status
// @access  Private (Admin)
const updateStoreStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        data: null
      });
    }

    store.status = status;
    await store.save();

    res.json({
      success: true,
      message: `Store status updated to ${status}`,
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get all orders across platform
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'All platform orders retrieved',
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

module.exports = {
  getAdminSummary,
  getAllUsers,
  toggleUserStatus,
  getAllStores,
  updateStoreStatus,
  getAllOrders
};
