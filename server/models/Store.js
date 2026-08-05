const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  storeName: { type: String, required: true, trim: true, unique: true, index: true },
  storeDescription: { type: String, required: true },
  logoUrl: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80' 
  },
  bannerUrl: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80' 
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'disabled'],
    default: 'active'
  },
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }, // Gross sales
  totalEarnings: { type: Number, default: 0 }, // 95% of gross
  platformCommissionPaid: { type: Number, default: 0 } // 5% of gross
}, {
  timestamps: true
});

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;
