const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('../server/routes/authRoutes');
const storeRoutes = require('../server/routes/storeRoutes');
const productRoutes = require('../server/routes/productRoutes');
const orderRoutes = require('../server/routes/orderRoutes');
const reviewRoutes = require('../server/routes/reviewRoutes');
const adminRoutes = require('../server/routes/adminRoutes');
const paymentRoutes = require('../server/routes/paymentRoutes');
const uploadRoutes = require('../server/routes/uploadRoutes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date(), service: "Artisan's Corner Vercel Serverless API" });
});

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);

module.exports = app;
