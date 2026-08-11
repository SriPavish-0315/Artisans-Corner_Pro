const getStripe = require('../config/stripe');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');

// @desc    Create Stripe PaymentIntent
// @route   POST /api/payment/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    const { amount, currency = 'usd', items } = req.body;
    const parsedAmount = Math.round((parseFloat(amount) || 50) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsedAmount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        itemCount: items ? items.length : 1,
        userEmail: req.user ? req.user.email : 'guest@example.com'
      }
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: parsedAmount / 100,
      currency: currency.toUpperCase()
    });
  } catch (error) {
    console.error('Error creating Stripe PaymentIntent:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize Stripe Payment Intent',
      error: error.message
    });
  }
};

// @desc    Confirm Stripe Payment & Create Order
// @route   POST /api/payment/confirm-order
// @access  Private
const confirmPaymentAndCreateOrder = async (req, res) => {
  try {
    const stripe = getStripe();
    const { paymentIntentId, items, totalAmount, shippingAddress, paymentMethod = 'Stripe Credit Card' } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'PaymentIntent ID is required'
      });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent || intent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Stripe PaymentIntent verification failed'
      });
    }

    const newOrder = new Order({
      buyer: req.user ? req.user._id : null,
      orderItems: items || [],
      totalPrice: totalAmount || 0,
      shippingAddress: shippingAddress || {},
      isPaid: true,
      paidAt: Date.now(),
      paymentResult: {
        id: paymentIntentId,
        status: intent.status,
        update_time: new Date().toISOString()
      },
      paymentMethod: paymentMethod,
      orderStatus: 'Paid'
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Payment confirmed and order created successfully!',
      data: {
        orderId: newOrder._id,
        transactionId: paymentIntentId,
        totalAmount: totalAmount,
        status: 'Paid',
        orderStatus: 'Paid'
      }
    });
  } catch (error) {
    console.error('Confirm Order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process order creation after Stripe payment',
      error: error.message
    });
  }
};

// @desc    Stripe Webhook Handler
// @route   POST /api/payment/webhook
// @access  Public (Stripe signature verified)
const handleStripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId && orderId !== 'N/A') {
      try {
        const order = await Order.findById(orderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.orderStatus = 'Paid';
          order.paymentResult = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: new Date().toISOString()
          };
          await order.save();

          for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
            const itemGross = item.price * item.quantity;
            const itemFee = itemGross * 0.05;
            const itemEarning = itemGross * 0.95;
            if (item.store) {
              await Store.findByIdAndUpdate(item.store, {
                $inc: {
                  totalSales: item.quantity,
                  totalRevenue: itemGross,
                  totalEarnings: itemEarning,
                  platformCommissionPaid: itemFee
                }
              });
            }
          }
        }
      } catch (e) {
        console.error('Webhook Order Processing Error:', e);
      }
    }
  }

  res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  confirmPaymentAndCreateOrder,
  handleStripeWebhook
};
