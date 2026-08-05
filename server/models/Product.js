const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: { type: String, required: true, trim: true, index: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Pottery & Ceramics', 'Jewelry & Accessories', 'Woodworking & Furniture', 'Textiles & Fiber Art', 'Paper & Stationery', 'Home Decor', 'Candles & Scents'],
    index: true 
  },
  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, min: 0, default: 1 },
  images: [{ type: String }],
  thumbnail: { type: String, required: true },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'draft', 'out_of_stock'], default: 'active' },
  tags: [{ type: String }]
}, {
  timestamps: true
});

productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;