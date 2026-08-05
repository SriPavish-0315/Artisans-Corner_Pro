const express = require('express');
const router = express.Router();
const {
  createProductReview,
  getProductReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createProductReview);
router.get('/product/:productId', getProductReviews);

module.exports = router;
