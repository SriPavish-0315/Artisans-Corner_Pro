const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Store = require('./models/Store');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Review = require('./models/Review');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/artisans_corner';

const seedDB = async (quiet = false) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    const userCount = await User.countDocuments();
    if (userCount > 0 && quiet) {
      // Database already seeded
      return;
    }

    if (!quiet) console.log('🌱 Seeding Artisan\'s Corner Database...');

    // Clear existing collection data and remove old indexes for a clean seed
    const collectionsToReset = ['users', 'stores', 'products', 'orders', 'reviews'];
    for (const collectionName of collectionsToReset) {
      try {
        await mongoose.connection.db.dropCollection(collectionName);
      } catch (error) {
        if (error.code !== 26) {
          throw error;
        }
      }
    }

    // 1. Create Users
    const buyer = await User.create({
      name: 'Eleanor Vance',
      email: 'buyer@example.com',
      password: 'password123',
      role: 'buyer',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      addresses: [{
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62704',
        country: 'USA',
        isDefault: true
      }]
    });

    const seller = await User.create({
      name: 'Mateo Rossi',
      email: 'seller@example.com',
      password: 'password123',
      role: 'seller',
      phone: '+1 (555) 876-5432',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    });

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 (555) 999-0000',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
    });

    // 2. Create Store for Seller
    const store = await Store.create({
      owner: seller._id,
      storeName: 'Heritage Handcrafts',
      storeDescription: 'Crafting timeless ceramic, wooden, and textile art using century-old techniques. Each piece is handmade with passion, sustainable materials, and attention to detail.',
      logoUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=200&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
      status: 'active',
      totalSales: 15,
      totalRevenue: 1250.00,
      totalEarnings: 1187.50,
      platformCommissionPaid: 62.50
    });

    // Link store to seller user
    seller.store = store._id;
    await seller.save();

    // 3. Create Products
    const productsData = [
      {
        seller: seller._id,
        store: store._id,
        name: 'Handcrafted Ceramic Tea Set',
        sku: 'CER-TEA-001',
        description: 'An exquisite 5-piece minimalist ceramic tea set made from speckled stoneware clay, featuring a bamboo-handle teapot and four matching cups.',
        category: 'Pottery & Ceramics',
        price: 85.00,
        discountPrice: 75.00,
        stock: 12,
        thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['ceramic', 'tea', 'handmade', 'pottery', 'kitchen'],
        averageRating: 4.8,
        totalReviews: 4
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Glazed Stoneware Dinner Plate Set',
        sku: 'CER-DIN-002',
        description: 'A handcrafted six-piece dinner plate set with subtle blue glaze and a smooth satin finish made for everyday elegance.',
        category: 'Pottery & Ceramics',
        price: 64.00,
        discountPrice: 58.00,
        stock: 9,
        thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['ceramics', 'stoneware', 'dinnerware', 'handmade'],
        averageRating: 4.6,
        totalReviews: 3
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Moonlit Clay Vase',
        sku: 'CER-VAS-003',
        description: 'A sculptural ceramic vase with a soft matte finish and organic silhouette that complements modern interiors.',
        category: 'Pottery & Ceramics',
        price: 49.00,
        discountPrice: 42.00,
        stock: 7,
        thumbnail: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['vase', 'ceramic', 'decor', 'handmade'],
        averageRating: 4.7,
        totalReviews: 2
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Silver Clay Pendant Necklace',
        sku: 'JWL-PND-004',
        description: 'A delicate pendant made from reclaimed silver clay and set with a tiny hand-cut moonstone.',
        category: 'Jewelry & Accessories',
        price: 92.00,
        discountPrice: 84.00,
        stock: 6,
        thumbnail: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['jewelry', 'silver', 'pendant', 'handmade'],
        averageRating: 4.9,
        totalReviews: 5
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Handwoven Leather Bracelet',
        sku: 'JWL-BRC-005',
        description: 'A supple leather bracelet braided by hand and finished with brass detailing for a timeless everyday look.',
        category: 'Jewelry & Accessories',
        price: 34.00,
        discountPrice: 29.00,
        stock: 11,
        thumbnail: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['bracelet', 'leather', 'accessories', 'handmade'],
        averageRating: 4.5,
        totalReviews: 4
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Vintage Hand-Carved Walnut Serving Bowl',
        sku: 'WD-BWL-006',
        description: 'Carved from a single block of sustainably sourced American walnut wood and finished with food-safe beeswax oil.',
        category: 'Woodworking & Furniture',
        price: 62.00,
        discountPrice: 55.00,
        stock: 5,
        thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['wooden bowl', 'walnut', 'carved', 'kitchenware', 'handmade'],
        averageRating: 5.0,
        totalReviews: 5
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Live Edge Oak Coffee Table',
        sku: 'WD-TBL-007',
        description: 'A sturdy coffee table featuring a live edge oak top and hand-finished iron legs for a contemporary rustic feel.',
        category: 'Woodworking & Furniture',
        price: 310.00,
        discountPrice: 285.00,
        stock: 3,
        thumbnail: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['furniture', 'oak', 'live edge', 'woodworking'],
        averageRating: 4.8,
        totalReviews: 2
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Artisan Woven Macrame Wall Hanging',
        sku: 'TEX-MAC-008',
        description: 'Boho-chic natural cotton rope macrame tapestry mounted on driftwood with intricate geometric patterns.',
        category: 'Textiles & Fiber Art',
        price: 45.00,
        discountPrice: 0,
        stock: 8,
        thumbnail: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['macrame', 'wall decor', 'woven', 'cotton', 'boho'],
        averageRating: 4.9,
        totalReviews: 3
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Indigo Block Printed Throw Pillow',
        sku: 'TEX-PIL-009',
        description: 'A hand-block printed pillow cover featuring natural dyes and a soft cotton weave made for cozy interiors.',
        category: 'Textiles & Fiber Art',
        price: 29.00,
        discountPrice: 24.00,
        stock: 12,
        thumbnail: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['textile', 'pillow', 'indigo', 'cotton'],
        averageRating: 4.6,
        totalReviews: 3
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Organic Leather Journal with Brass Clasp',
        sku: 'PPR-JRN-010',
        description: 'Hand-bound full-grain vegetable-tanned leather journal containing 200 pages of recycled cotton deckle-edge paper.',
        category: 'Paper & Stationery',
        price: 38.00,
        discountPrice: 0,
        stock: 20,
        thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['leather', 'journal', 'notebook', 'brass', 'stationery'],
        averageRating: 4.7,
        totalReviews: 2
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Letterpress Greeting Card Set',
        sku: 'PPR-CRD-011',
        description: 'A set of handmade greeting cards printed with botanical illustrations and tucked into a recycled paper sleeve.',
        category: 'Paper & Stationery',
        price: 16.00,
        discountPrice: 14.00,
        stock: 18,
        thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['cards', 'paper', 'stationery', 'gift'],
        averageRating: 4.4,
        totalReviews: 2
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Terracotta Planter with Glaze',
        sku: 'HOM-PLN-012',
        description: 'A hand-thrown planter with an earthy glaze that adds warmth to kitchens, patios, and living spaces.',
        category: 'Home Decor',
        price: 33.00,
        discountPrice: 29.00,
        stock: 10,
        thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['planter', 'home decor', 'ceramic', 'garden'],
        averageRating: 4.8,
        totalReviews: 4
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Botanical Soy Wax Candle Trio',
        sku: 'CND-TRI-013',
        description: 'A set of 3 hand-poured 100% natural soy candles infused with lavender, sandalwood, and wild eucalyptus.',
        category: 'Candles & Scents',
        price: 28.00,
        discountPrice: 24.00,
        stock: 15,
        thumbnail: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['candles', 'soy wax', 'essential oils', 'aromatherapy', 'gift set'],
        averageRating: 4.9,
        totalReviews: 6
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Herbal Room Spray Collection',
        sku: 'CND-RMS-014',
        description: 'A trio of artisan room sprays made with essential oils, dried botanicals, and recycled glass bottles.',
        category: 'Candles & Scents',
        price: 24.00,
        discountPrice: 21.00,
        stock: 13,
        thumbnail: 'https://images.unsplash.com/photo-1608571424352-9261a1e1e6f3?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1608571424352-9261a1e1e6f3?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['room spray', 'botanicals', 'aromatherapy', 'gift'],
        averageRating: 4.7,
        totalReviews: 3
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Handwoven Pashmina Wool & Silk Scarf',
        sku: 'TEX-SCF-015',
        description: 'Ultra-soft hand-spun pashmina wool blended with natural silk and dyed with organic indigo and madder root.',
        category: 'Textiles & Fiber Art',
        price: 55.00,
        discountPrice: 0,
        stock: 10,
        thumbnail: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
        images: [
          'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80'
        ],
        tags: ['scarf', 'pashmina', 'handwoven', 'silk', 'fashion'],
        averageRating: 5.0,
        totalReviews: 1
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Rustic Terracotta Serving Pitcher',
        sku: 'CER-PIT-016',
        description: 'A hand-thrown terracotta pitcher finished with an interior food-safe glaze and an ergonomic curved handle.',
        category: 'Pottery & Ceramics',
        price: 52.00,
        discountPrice: 46.00,
        stock: 8,
        thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'],
        tags: ['pitcher', 'terracotta', 'ceramics', 'kitchen'],
        averageRating: 4.8,
        totalReviews: 6
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Hand-Hammered Sterling Silver Band',
        sku: 'JWL-RNG-017',
        description: 'A minimalist sterling silver ring featuring a hand-hammered textured surface and polished inner comfort fit.',
        category: 'Jewelry & Accessories',
        price: 54.00,
        discountPrice: 48.00,
        stock: 14,
        thumbnail: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80'],
        tags: ['ring', 'silver', 'jewelry', 'handmade'],
        averageRating: 4.9,
        totalReviews: 8
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Resin & Cedar Coaster Set of 4',
        sku: 'WD-CST-018',
        description: 'Handcrafted drink coasters combining aromatic red cedar wood fragments with crystal-clear turquoise epoxy resin.',
        category: 'Woodworking & Furniture',
        price: 38.00,
        discountPrice: 32.00,
        stock: 16,
        thumbnail: 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=600&q=80'],
        tags: ['coasters', 'woodworking', 'resin', 'home decor'],
        averageRating: 5.0,
        totalReviews: 9
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Woven Chunky Knit Wool Pouf',
        sku: 'TEX-POU-019',
        description: 'A cozy hand-knit floor pouf made from 100% un-dyed merino wool yarn that serves as an ottoman or footrest.',
        category: 'Textiles & Fiber Art',
        price: 115.00,
        discountPrice: 98.00,
        stock: 4,
        thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80'],
        tags: ['pouf', 'knit', 'wool', 'furniture', 'textile'],
        averageRating: 4.9,
        totalReviews: 5
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Calligraphy Wax Seal Stamp Kit',
        sku: 'PPR-WAX-020',
        description: 'A vintage brass wax seal stamp with a rosewood handle, complete with 3 sticks of metallic gold sealing wax.',
        category: 'Paper & Stationery',
        price: 26.00,
        discountPrice: 22.00,
        stock: 22,
        thumbnail: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=600&q=80'],
        tags: ['wax seal', 'stationery', 'vintage', 'gift'],
        averageRating: 4.8,
        totalReviews: 7
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Hand-Painted Ceramic Table Lamp',
        sku: 'HOM-LMP-021',
        description: 'A ceramic vessel table lamp with hand-painted botanical motifs and a natural linen drum lampshade.',
        category: 'Home Decor',
        price: 135.00,
        discountPrice: 120.00,
        stock: 5,
        thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80'],
        tags: ['lamp', 'lighting', 'home decor', 'ceramic'],
        averageRating: 4.9,
        totalReviews: 4
      },
      {
        seller: seller._id,
        store: store._id,
        name: 'Spiced Vanilla & Cinnamon Beeswax Candle',
        sku: 'CND-VAN-022',
        description: 'A hand-poured pure beeswax candle infused with Madagascar vanilla bean and warm Ceylon cinnamon bark.',
        category: 'Candles & Scents',
        price: 25.00,
        discountPrice: 0,
        stock: 19,
        thumbnail: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80',
        images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80'],
        tags: ['beeswax', 'candle', 'vanilla', 'cinnamon'],
        averageRating: 4.9,
        totalReviews: 12
      }
    ];

    const createdProducts = await Product.insertMany(productsData);

    const createOrderNumber = (suffix) => `ORD-${Date.now()}-${String(suffix).padStart(2, '0')}`;

    // 4. Create Sample Orders
    const order1 = await Order.create({
      buyer: buyer._id,
      orderNumber: createOrderNumber(1),
      orderItems: [
        {
          product: createdProducts[0]._id,
          name: createdProducts[0].name,
          quantity: 1,
          price: createdProducts[0].price,
          image: createdProducts[0].thumbnail,
          seller: seller._id,
          store: store._id
        },
        {
          product: createdProducts[2]._id,
          name: createdProducts[2].name,
          quantity: 1,
          price: createdProducts[2].price,
          image: createdProducts[2].thumbnail,
          seller: seller._id,
          store: store._id
        }
      ],
      shippingAddress: buyer.addresses[0],
      paymentMethod: 'Stripe (Simulated)',
      itemsPrice: 147.00,
      platformFee: 7.35,
      sellerEarnings: 139.65,
      shippingPrice: 0.00,
      taxPrice: 11.76,
      totalPrice: 158.76,
      isPaid: true,
      paidAt: Date.now() - 86400000 * 3,
      orderStatus: 'Delivered',
      deliveredAt: Date.now() - 86400000
    });

    const order2 = await Order.create({
      buyer: buyer._id,
      orderNumber: createOrderNumber(2),
      orderItems: [
        {
          product: createdProducts[1]._id,
          name: createdProducts[1].name,
          quantity: 2,
          price: createdProducts[1].price,
          image: createdProducts[1].thumbnail,
          seller: seller._id,
          store: store._id
        }
      ],
      shippingAddress: buyer.addresses[0],
      paymentMethod: 'Stripe (Simulated)',
      itemsPrice: 90.00,
      platformFee: 4.50,
      sellerEarnings: 85.50,
      shippingPrice: 10.00,
      taxPrice: 7.20,
      totalPrice: 107.20,
      isPaid: true,
      paidAt: Date.now() - 86400000,
      orderStatus: 'Processing'
    });

    // 5. Create Reviews
    await Review.create({
      product: createdProducts[0]._id,
      user: buyer._id,
      name: buyer.name,
      rating: 5,
      comment: 'Absolutely stunning quality! The ceramic teapot holds heat remarkably well and looks incredible on my dining table.'
    });

    await Review.create({
      product: createdProducts[2]._id,
      user: buyer._id,
      name: buyer.name,
      rating: 5,
      comment: 'The walnut grain is gorgeous and feels so smooth. Highly recommend Heritage Handcrafts!'
    });

    if (!quiet) console.log('✅ Database seeded successfully with demo users, stores, products & orders!');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};

if (require.main === module) {
  seedDB().then(() => mongoose.connection.close());
}

module.exports = seedDB;
