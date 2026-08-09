const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer)
const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
        data: null
      });
    }

    // Server-side validation of products, stock, prices, sellers & stores
    let itemsPrice = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.name || item.product}`,
          data: null
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${product.name}". Available: ${product.stock}`,
          data: null
        });
      }

      const itemTotal = product.price * item.quantity;
      itemsPrice += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.thumbnail || product.images[0],
        seller: product.seller,
        store: product.store
      });
    }

    // Commission logic: 5% platform fee, 95% seller earnings
    const platformFee = itemsPrice * 0.05;
    const sellerEarnings = itemsPrice * 0.95;
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = itemsPrice * 0.08;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = new Order({
      buyer: req.user._id,
      orderItems: validatedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Stripe',
      itemsPrice,
      platformFee,
      sellerEarnings,
      shippingPrice,
      taxPrice,
      totalPrice,
      orderStatus: 'Pending'
    });

    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email avatar')
      .populate('orderItems.seller', 'name email')
      .populate('orderItems.store', 'storeName logoUrl');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    // Check authorization: Buyer, Seller of items in order, or Admin
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.orderItems.some(item => item.seller._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Update order to paid (Stripe callback / simulate payment)
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'Paid';
    order.paymentResult = {
      id: req.body.id || `PAY-${Date.now()}`,
      status: req.body.status || 'COMPLETED',
      update_time: req.body.update_time || new Date().toISOString(),
      email_address: req.body.email_address || req.user.email
    };

    const updatedOrder = await order.save();

    // Deduct product stock & update seller store stats
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });

      const itemGross = item.price * item.quantity;
      const itemFee = itemGross * 0.05;
      const itemEarning = itemGross * 0.95;

      await Store.findByIdAndUpdate(item.store, {
        $inc: {
          totalSales: item.quantity,
          totalRevenue: itemGross,
          totalEarnings: itemEarning,
          platformCommissionPaid: itemFee
        }
      });
    }

    res.json({
      success: true,
      message: 'Order marked as paid and stock updated',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Update order status (Seller / Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Seller/Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Paid', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${allowedStatuses.join(', ')}`,
        data: null
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        data: null
      });
    }

    order.orderStatus = status;
    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private (Buyer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'User orders retrieved',
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

// @desc    Get seller orders (orders containing products from seller's store)
// @route   GET /api/orders/sellerorders
// @access  Private (Seller)
const getSellerOrders = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
        data: null
      });
    }

    const orders = await Order.find({ 'orderItems.store': store._id })
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Seller orders retrieved',
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
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getSellerOrders
};