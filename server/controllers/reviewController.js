const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Create product review
// @route   POST /api/reviews
// @access  Private (Buyer)
const createProductReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    // Business Rule: Sellers cannot review their own products
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Sellers cannot review their own products',
        data: null
      });
    }

    // Business Rule: Only verified buyers who purchased product can review
    const hasPurchased = await Order.findOne({
      buyer: req.user._id,
      'orderItems.product': productId,
      isPaid: true
    });

    if (!hasPurchased) {
      return res.status(400).json({
        success: false,
        message: 'Only verified buyers who purchased this product can leave a review',
        data: null
      });
    }

    // Business Rule: 1 review per buyer per product
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
        data: null
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
    });

    // Recalculate product rating
    const reviews = await Review.find({ product: productId });
    product.totalReviews = reviews.length;
    product.averageRating =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Product reviews retrieved',
      data: reviews
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
  createProductReview,
  getProductReviews
};
