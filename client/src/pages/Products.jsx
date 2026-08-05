import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { MOCK_CATALOG, CATEGORY_NAMES as CATEGORIES } from '../data/catalogData';

const Products = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialKeyword = searchParams.get('keyword') || '';

  const [products, setProducts] = useState(MOCK_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [maxPrice, setMaxPrice] = useState(200);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, keyword, maxPrice, sortBy, page]);

  const fetchProducts = async () => {
    try {
      let url = `http://localhost:5000/api/products?page=${page}&limit=8&maxPrice=${maxPrice}`;
      if (selectedCategory !== 'All Categories') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

      const { data } = await axios.get(url);
      if (data.success && data.data.length > 0) {
        setProducts(data.data);
        if (data.pagination) setTotalPages(data.pagination.totalPages);
      } else {
        applyLocalFilter();
      }
    } catch (err) {
      applyLocalFilter();
    }
  };

  const applyLocalFilter = () => {
    let result = [...MOCK_CATALOG];
    if (selectedCategory !== 'All Categories') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (keyword) {
      result = result.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()));
    }
    result = result.filter(p => p.price <= maxPrice);

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);

    setProducts(result);
    setTotalPages(1);
  };

  const handleAddToCart = (item) => {
    addToCart(item, 1);
    setAddedId(item._id);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Breadcrumbs & Title */}
      <div>
        <nav className="text-xs text-gray-500 mb-2">
          <Link to="/" className="hover:underline">Home</Link> / <span className="text-amber-800 font-semibold">Artisan Catalog</span>
        </nav>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-gray-900">
          Handmade Goods Catalog
        </h1>
        <p className="text-gray-600 text-sm mt-1">Discover unique, handcrafted creations direct from verified independent sellers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Filters Sidebar */}
        <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm h-fit space-y-6">
          
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-3 border-b pb-2 flex justify-between items-center">
              <span>Categories</span>
              <i className="fa-solid fa-filter text-amber-700 text-xs"></i>
            </h3>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setPage(1); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-800 text-white font-semibold shadow-xs'
                      : 'text-gray-700 hover:bg-amber-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-3 border-b pb-2">
              Price Limit: <span className="text-amber-800">${maxPrice}</span>
            </h3>
            <input
              type="range"
              min="10"
              max="300"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-800"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$10</span>
              <span>$300+</span>
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSelectedCategory('All Categories');
              setKeyword('');
              setMaxPrice(300);
            }}
            className="w-full py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Bar: Results Count & Sort Dropdown */}
          <div className="bg-white rounded-2xl p-4 border border-amber-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 font-medium">
              Showing <strong className="text-gray-900">{products.length}</strong> items
              {selectedCategory !== 'All Categories' && <span> in <strong className="text-amber-800">{selectedCategory}</strong></span>}
            </p>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-semibold">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-amber-50/50 border border-amber-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-amber-100 space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-box-open"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">No products found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or category selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl overflow-hidden border border-amber-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-square overflow-hidden bg-amber-50">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">
                        {item.category}
                      </span>
                      <Link to={`/product/${item._id}`}>
                        <h3 className="font-bold text-gray-900 text-base line-clamp-2 hover:text-amber-700">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        <i className="fa-solid fa-store text-[10px] mr-1 text-amber-700"></i>
                        {item.store?.storeName || 'Artisan Workshop'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-xs text-amber-500 space-x-1">
                          <i className="fa-solid fa-star"></i>
                          <span className="font-bold text-gray-800">{item.averageRating}</span>
                          <span className="text-gray-400">({item.totalReviews})</span>
                        </div>
                        <span className="text-lg font-extrabold text-gray-900 mt-1 block">${item.price}</span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          addedId === item._id
                            ? 'bg-green-600 text-white'
                            : 'bg-amber-100 hover:bg-amber-800 text-amber-900 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${addedId === item._id ? 'fa-check' : 'fa-basket-shopping'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 pt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-4 py-2 border rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-bold text-amber-900">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-4 py-2 border rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Products;
