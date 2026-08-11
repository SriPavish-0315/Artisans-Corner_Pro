const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryURI = process.env.MONGO_URI;
  const localURI = 'mongodb://127.0.0.1:27017/artisans_corner';

  try {
    const conn = await mongoose.connect(
      primaryURI || localURI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (primaryErr) {
    console.error(`⚠️ Mongo Atlas connection error (${primaryErr.message}). Connecting to local MongoDB fallback...`);
    try {
      const conn = await mongoose.connect(localURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
    } catch (localErr) {
      console.error(`❌ MongoDB Local Fallback Error: ${localErr.message}`);
      process.exit(1);
    }
  }

  // Auto-seed database if empty
  try {
    const seedDB = require('../seeder');
    await seedDB(true);
  } catch (seedErr) {
    console.log('Seeder check notice:', seedErr.message);
  }
};

module.exports = connectDB;