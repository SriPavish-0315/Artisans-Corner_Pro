import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { CATEGORIES } from '../data/catalogData';

// Mock initial featured products to ensure instant rich visuals if backend server is starting
const SAMPLE_PRODUCTS = [
  {
    _id: 'p1',
    name: 'Hand-thrown Speckled Ceramic Mug',
    category: 'Pottery & Ceramics',
    price: 38,
    discountPrice: 45,
    averageRating: 4.9,
    totalReviews: 24,
    thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    store: { storeName: 'Terra Cotta Studios' }
  },
  {
    _id: 'p2',
    name: 'Walnut & Ocean Resin Board',
    category: 'Woodworking & Furniture',
    price: 120,
    discountPrice: 140,
    averageRating: 5.0,
    totalReviews: 18,
    thumbnail: 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=600&q=80',
    store: { storeName: 'Wood & Wave Artisans' }
  },
  {
    _id: 'p3',
    name: 'Raw Emerald & Gold Filled Pendant',
    category: 'Jewelry & Accessories',
    price: 85,
    discountPrice: 0,
    averageRating: 4.8,
    totalReviews: 31,
    thumbnail: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    store: { storeName: 'Lumina Gems' }
  },
  {
    _id: 'p4',
    name: 'Hand-loomed Linen Throw Blanket',
    category: 'Textiles & Fiber Art',
    price: 95,
    discountPrice: 110,
    averageRating: 4.7,
    totalReviews: 12,
    thumbnail: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    store: { storeName: 'Weaver & Loom' }
  }
];

const Home = () => {
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/products?limit=8');
        if (data.success && data.data.length > 0) {
          setProducts(data.data);
        }
      } catch (err) {
        console.log('Using sample fallback products');
      }
    };
    fetchFeatured();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Banner Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <section className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-amber-900 to-amber-800 text-white rounded-3xl shadow-2xl border border-amber-800/40">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="px-6 lg:px-12 py-16 lg:py-24 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              <i className="fa-solid fa-sparkles"></i> Handcrafted Excellence
            </span>
            <h1 className="font-serif-title text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Unique Handmade Treasures, Direct From The Creator.
            </h1>
            <p className="text-amber-100/80 text-base sm:text-lg max-w-xl leading-relaxed font-light">
              Connect with independent artisans worldwide. Discover ethically crafted pottery, bespoke jewelry, heirloom woodworking, and artisan goods.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                to="/products"
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-base rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105 text-center"
              >
                Shop Unique Goods <i className="fa-solid fa-arrow-right ml-2"></i>
              </Link>
              <Link
                to="/become-seller"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-base rounded-2xl backdrop-blur-md transition-all text-center"
              >
                Open Your Store
              </Link>
            </div>

            {/* Platform Stats */}
            <div className="pt-8 border-t border-amber-700/50 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-2xl font-extrabold text-amber-300">1,200+</p>
                <p className="text-xs text-amber-200/70 uppercase">Master Artisans</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-amber-300">100%</p>
                <p className="text-xs text-amber-200/70 uppercase">Handmade Guarantee</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-amber-300">5%</p>
                <p className="text-xs text-amber-200/70 uppercase">Fair Platform Fee</p>
              </div>
            </div>
          </div>

          {/* Hero Collage Image */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-700/50 group">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80"
                alt="Artisan at work"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 text-gray-900 w-full shadow-lg">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Featured Vendor</p>
                  <p className="font-serif-title font-bold text-lg">Terra Cotta Studios</p>
                  <p className="text-xs text-gray-600">Hand-thrown Stoneware & Ceramics • Kyoto, Japan</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
      </div>

      {/* Category Explorer Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-serif-title text-3xl font-bold text-gray-900">Explore Craft Categories</h2>
            <p className="text-gray-600 text-sm mt-1">Browse by specialized artisan craft disciplines</p>
          </div>
          <Link to="/products" className="text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
            All Categories <i className="fa-solid fa-chevron-right text-xs"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group relative rounded-2xl overflow-hidden h-64 shadow-md hover:shadow-xl transition-all duration-300 border border-amber-100 flex flex-col justify-end p-6 text-white"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="relative z-10">
                <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                  {cat.count}
                </span>
                <h3 className="font-serif-title text-xl font-bold leading-snug group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Handpicked Selections</span>
            <h2 className="font-serif-title text-3xl font-bold text-gray-900">Featured Artisan Creations</h2>
          </div>
          <Link to="/products" className="text-sm font-bold text-amber-800 hover:text-amber-900">
            View All Products →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl overflow-hidden border border-amber-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-amber-50">
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-amber-900/80 backdrop-blur-md text-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {item.category.split(' ')[0]}
                </span>
              </div>

              {/* Product Content */}
              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-xs text-amber-800 font-semibold mb-1">
                    <i className="fa-solid fa-store text-[10px] mr-1"></i>
                    {item.store?.storeName || 'Artisan Workshop'}
                  </p>
                  <Link to={`/product/${item._id}`}>
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 hover:text-amber-700 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center text-xs text-amber-500 space-x-1">
                      <i className="fa-solid fa-star"></i>
                      <span className="font-bold text-gray-800">{item.averageRating || 4.9}</span>
                      <span className="text-gray-400">({item.totalReviews || 12})</span>
                    </div>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-lg font-extrabold text-gray-900">${item.price}</span>
                      {item.discountPrice > item.price && (
                        <span className="text-xs text-gray-400 line-through">${item.discountPrice}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      addedId === item._id
                        ? 'bg-green-600 text-white scale-110'
                        : 'bg-amber-100 hover:bg-amber-800 text-amber-900 hover:text-white'
                    }`}
                    title="Add to Cart"
                  >
                    <i className={`fa-solid ${addedId === item._id ? 'fa-check' : 'fa-basket-shopping'}`}></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promotional Vendor Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-900 to-amber-950 rounded-3xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-4 text-center lg:text-left max-w-2xl">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase border border-amber-400/30">
              Low 5% Platform Fee
            </span>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold">Are you an independent craftsman?</h2>
            <p className="text-amber-100/80 text-sm sm:text-base leading-relaxed">
              Join thousands of creators turning their passion into a thriving business. Keep 95% of every sale with clear, automated payouts and custom store branding.
            </p>
          </div>
          <Link
            to="/become-seller"
            className="px-8 py-4 bg-amber-400 text-amber-950 font-bold rounded-2xl hover:bg-amber-300 transition-all shadow-lg text-center whitespace-nowrap"
          >
            Start Selling Today →
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
