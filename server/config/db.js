const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/artisans_corner',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Auto-seed database if empty (useful for cloud deployments like Railway)
        try {
            const seedDB = require('../seeder');
            await seedDB(true);
        } catch (seedErr) {
            console.log('Seeder check notice:', seedErr.message);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;