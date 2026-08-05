import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImg, setSelectedImg] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [added, setAdded] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/products/${id}`);
      if (data.success) {
        setProduct(data.data);
        setSelectedImg(data.data.thumbnail || data.data.images[0]);
      }
    } catch (err) {
      // Demo Fallback item
      const mockItem = {
        _id: id || 'p1',
        name: 'Hand-thrown Speckled Ceramic Coffee Mug',
        category: 'Pottery & Ceramics',
        sku: 'POT-1082-KYOTO',
        price: 38,
        stock: 12,
        description: 'Meticulously crafted on the wheel using high-fire stoneware clay. Finished with a satin speckled white glaze and ergonomic handle designed for cozy morning brews.',
        averageRating: 4.9,
        totalReviews: 2,
        images: [
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
        ],
        thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        store: {
          _id: 's1',
          storeName: 'Terra Cotta Studios',
          storeDescription: 'Handcrafted stoneware ceramics made in Kyoto.',
          logoUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=200&q=80'
        },
        seller: { name: 'Elena Vance' }
      };
      setProduct(mockItem);
      setSelectedImg(mockItem.images[0]);
      setReviews([
        { _id: 'r1', name: 'Sophia Martinez', rating: 5, comment: 'Absolutely stunning quality! Holds heat wonderfully.', createdAt: '2026-07-20' },
        { _id: 'r2', name: 'Liam Chen', rating: 5, comment: 'The speckled glaze texture feels so premium.', createdAt: '2026-07-15' }
      ]);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a review.');
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };
      const { data } = await axios.post('http://localhost:5000/api/reviews', {
        productId: product._id,
        rating,
        comment
      }, config);

      if (data.success) {
        setReviewMsg('Review added successfully!');
        setReviews([data.data, ...reviews]);
        setComment('');
      }
    } catch (error) {
      // Demo mode review add
      const newRev = {
        _id: 'r_' + Date.now(),
        name: user.name,
        rating,
        comment,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setReviews([newRev, ...reviews]);
      setReviewMsg('Review submitted (Demo Mode)!');
      setComment('');
    }
  };

  if (!product) {
    return <div className="text-center py-20 font-bold text-gray-600">Loading product details...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500">
        <Link to="/" className="hover:underline">Home</Link> / <Link to="/products" className="hover:underline">Products</Link> / <span className="text-amber-800 font-semibold">{product.name}</span>
      </nav>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-amber-50 border border-amber-100 shadow-md">
            <img src={selectedImg} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex gap-4">
            {product.images?.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImg(img)}
                className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedImg === img ? 'border-amber-700 scale-105 shadow-md' : 'border-amber-100 opacity-70'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Details & Purchase */}
        <div className="space-y-6">
          
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              {product.category}
            </span>
            <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-gray-900 mt-3">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center space-x-2 text-amber-500">
            <div className="flex text-sm">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fa-solid fa-star ${i < Math.floor(product.averageRating) ? 'text-amber-500' : 'text-gray-200'}`}></i>
              ))}
            </div>
            <span className="font-bold text-gray-900 text-sm">{product.averageRating}</span>
            <span className="text-gray-400 text-xs">({reviews.length} customer reviews)</span>
          </div>

          {/* Price & Stock */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold text-gray-900">${product.price}</span>
              <p className="text-xs text-gray-500 mt-0.5">Includes taxes & verified craftsman warranty</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Artisan Description</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity & Action Buttons */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-gray-700">Quantity:</span>
              <div className="flex items-center border border-amber-200 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 text-gray-600 hover:bg-amber-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1 text-sm font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="px-3.5 py-1.5 text-gray-600 hover:bg-amber-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                  added ? 'bg-green-600 text-white' : 'bg-amber-800 hover:bg-amber-900 text-white'
                }`}
              >
                <i className={`fa-solid ${added ? 'fa-check' : 'fa-basket-shopping'}`}></i>
                {added ? 'Added to Cart!' : 'Add to Shopping Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                className="px-8 py-4 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-md transition-all"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Vendor Card */}
          <div className="bg-white rounded-2xl p-5 border border-amber-100 flex items-center space-x-4 shadow-xs">
            <img
              src={product.store?.logoUrl || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=150&q=80'}
              alt={product.store?.storeName}
              className="w-14 h-14 rounded-2xl object-cover border border-amber-200"
            />
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Crafted By</p>
              <h4 className="font-serif-title font-bold text-gray-900 text-base">{product.store?.storeName || 'Artisan Workshop'}</h4>
              <p className="text-xs text-gray-500 leading-tight mt-0.5">{product.store?.storeDescription}</p>
            </div>
          </div>

        </div>

      </div>

      {/* Reviews & Ratings Section */}
      <section className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-serif-title text-2xl font-bold text-gray-900">Verified Buyer Reviews</h2>
            <p className="text-xs text-gray-500">Only verified buyers who purchased this product can submit a review.</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-amber-800">{product.averageRating}</span>
            <span className="text-xs text-gray-400 block">out of 5.0 stars</span>
          </div>
        </div>

        {/* Add Review Form */}
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Write a Customer Review</h3>
          {reviewMsg && <p className="text-xs font-bold text-green-700">{reviewMsg}</p>}
          <form onSubmit={handleAddReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Rating:</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 - Exceptional</option>
                <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                <option value="3">⭐⭐⭐ 3 - Average</option>
                <option value="2">⭐⭐ 2 - Poor</option>
                <option value="1">⭐ 1 - Terrible</option>
              </select>
            </div>

            <div>
              <textarea
                rows="3"
                placeholder="Share your thoughts about the craft quality, packaging, and experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="w-full p-3 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900 transition-colors"
            >
              Submit Verified Review
            </button>
          </form>
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          {reviews.map((rev, i) => (
            <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900">{rev.name}</span>
                <span className="text-xs text-gray-400">{rev.createdAt}</span>
              </div>
              <div className="flex text-amber-500 text-xs">
                {[...Array(5)].map((_, r) => (
                  <i key={r} className={`fa-solid fa-star ${r < rev.rating ? 'text-amber-500' : 'text-gray-200'}`}></i>
                ))}
              </div>
              <p className="text-sm text-gray-700">{rev.comment}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default ProductDetails;
