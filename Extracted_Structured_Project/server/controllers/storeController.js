const Store = require('../models/Store');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create a store / Become a seller
// @route   POST /api/stores
// @access  Private (Buyer)
const createStore = async (req, res) => {
  try {
    const { storeName, storeDescription, logoUrl, bannerUrl } = req.body;

    const existingStore = await Store.findOne({ owner: req.user._id });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'You already own a store',
        data: null
      });
    }

    const nameTaken = await Store.findOne({ storeName });
    if (nameTaken) {
      return res.status(400).json({
        success: false,
        message: 'Store name is already taken',
        data: null
      });
    }

    const store = await Store.create({
      owner: req.user._id,
      storeName,
      storeDescription,
      logoUrl: logoUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      status: 'active'
    });

    // Update user role to seller and associate store
    await User.findByIdAndUpdate(req.user._id, {
      role: 'seller',
      store: store._id
    });

    res.status(201).json({
      success: true,
      message: 'Store created successfully! You are now a seller.',
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

// @desc    Get current user's store
// @route   GET /api/stores/mystore
// @access  Private (Seller)
const getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id }).populate('owner', 'name email avatar');
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'No store found for this user',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Store details retrieved',
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

// @desc    Update store profile
// @route   PUT /api/stores/mystore
// @access  Private (Seller)
const updateStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        data: null
      });
    }

    store.storeName = req.body.storeName || store.storeName;
    store.storeDescription = req.body.storeDescription || store.storeDescription;
    if (req.body.logoUrl) store.logoUrl = req.body.logoUrl;
    if (req.body.bannerUrl) store.bannerUrl = req.body.bannerUrl;

    const updatedStore = await store.save();

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: updatedStore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get seller dashboard analytics
// @route   GET /api/stores/dashboard
// @access  Private (Seller)
const getSellerDashboard = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        data: null
      });
    }

    const totalProducts = await Product.countDocuments({ store: store._id });
    
    // Find all orders containing products from this store
    const orders = await Order.find({ 'orderItems.store': store._id }).sort({ createdAt: -1 });

    let totalRevenue = 0;
    let totalItemsSold = 0;
    let pendingOrdersCount = 0;
    let completedOrdersCount = 0;

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.store.toString() === store._id.toString()) {
          if (order.isPaid) {
            totalRevenue += item.price * item.quantity;
            totalItemsSold += item.quantity;
          }
        }
      });

      if (order.orderStatus === 'Pending' || order.orderStatus === 'Processing' || order.orderStatus === 'Packed') {
        pendingOrdersCount++;
      } else if (order.orderStatus === 'Delivered') {
        completedOrdersCount++;
      }
    });

    const platformCommission = totalRevenue * 0.05;
    const sellerEarnings = totalRevenue * 0.95;

    res.json({
      success: true,
      message: 'Seller analytics retrieved',
      data: {
        store,
        metrics: {
          totalProducts,
          totalOrders: orders.length,
          totalRevenue,
          sellerEarnings,
          platformCommission,
          totalItemsSold,
          pendingOrdersCount,
          completedOrdersCount
        },
        recentOrders: orders.slice(0, 5)
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

module.exports = {
  createStore,
  getMyStore,
  updateStore,
  getSellerDashboard
};
