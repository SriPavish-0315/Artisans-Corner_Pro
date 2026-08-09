import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
      {/* Top Banner */}
      <div className="bg-amber-900 text-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-col sm:flex-row justify-between items-center text-xs gap-1">
          <p className="font-medium tracking-wide text-center sm:text-left">
            ✨ Supporting Independent Craftsmen & Local Artisans Worldwide | Platform Fee: 5% Only
          </p>
          <div className="flex gap-4 items-center font-medium">
            {user ? (
              <span>Welcome, <strong className="text-amber-300">{user.name}</strong> ({user.role.toUpperCase()})</span>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="hover:underline">Login</Link>
                <span>|</span>
                <Link to="/register" className="hover:underline">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-800 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-900/20 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-shapes text-2xl"></i>
            </div>
            <div>
              <span className="font-serif-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2 leading-tight">
                <i className="fa-solid fa-paintbrush text-amber-600 text-lg"></i>
                Artisan's<span className="text-amber-700">Corner</span>
                <i className="fa-solid fa-gem text-amber-500 text-xs"></i>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800/70 block">
                Handmade Goods Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              placeholder="Search pottery, jewelry, leather, woodwork..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-amber-50/50 border border-amber-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-amber-800 text-white flex items-center justify-center hover:bg-amber-900 transition-colors shadow"
            >
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </button>
          </form>

          {/* Nav Icons & User Controls */}
          <div className="flex items-center space-x-5">
            <Link to="/products" className="hidden sm:flex items-center text-sm font-semibold text-gray-700 hover:text-amber-800 transition-colors">
              <i className="fa-solid fa-store mr-1.5 text-amber-700"></i> Explore Goods
            </Link>

            {/* Become Seller CTA if Buyer */}
            {(!user || user.role === 'buyer') && (
              <Link
                to="/become-seller"
                className="hidden lg:inline-flex items-center text-xs font-bold bg-amber-100 text-amber-900 px-3.5 py-2 rounded-full border border-amber-300 hover:bg-amber-200 transition-all shadow-xs"
              >
                <i className="fa-solid fa-store mr-1.5 text-amber-700"></i> Sell Handmade Goods
              </Link>
            )}

            {/* Shopping Cart Icon */}
            <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-amber-100/60 text-gray-700 hover:text-amber-900 transition-all">
              <i className="fa-solid fa-basket-shopping text-xl"></i>
              {totalItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce shadow">
                  {totalItemCount}
                </span>
              )}
            </Link>

            {/* User Profile / Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center space-x-2 p-1.5 rounded-full border border-amber-200 hover:border-amber-400 focus:outline-none bg-amber-50/50"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-amber-300"
                  />
                  <i className="fa-solid fa-chevron-down text-xs text-gray-500 pr-1"></i>
                </button>

                {/* Dropdown Menu */}
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-amber-100 py-2 z-50 divide-y divide-gray-100 animate-fadeIn">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900"
                      >
                        <i className="fa-regular fa-user mr-2.5 w-4 text-amber-700"></i> My Profile & Orders
                      </Link>

                      {user.role === 'seller' && (
                        <Link
                          to="/seller/dashboard"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center px-4 py-2 text-sm text-amber-900 font-semibold bg-amber-50/80 hover:bg-amber-100"
                        >
                          <i className="fa-solid fa-chart-line mr-2.5 w-4 text-amber-700"></i> Seller Dashboard
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center px-4 py-2 text-sm text-purple-900 font-semibold bg-purple-50 hover:bg-purple-100"
                        >
                          <i className="fa-solid fa-user-shield mr-2.5 w-4 text-purple-700"></i> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket mr-2.5 w-4"></i> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-amber-900 hover:text-amber-700"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-800 rounded-full hover:bg-amber-900 shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-amber-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-full text-sm bg-gray-50 focus:outline-none"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-gray-500">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </form>

          <div className="flex flex-col space-y-2 pt-2">
            <Link to="/products" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-gray-800 hover:bg-amber-50 rounded-lg">
              <i className="fa-solid fa-store mr-2 text-amber-700"></i> Explore Products
            </Link>
            {(!user || user.role === 'buyer') && (
              <Link to="/become-seller" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-amber-800 bg-amber-50 rounded-lg">
                <i className="fa-solid fa-gem mr-2"></i> Become a Seller
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link to="/seller/dashboard" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-bold text-amber-900 bg-amber-100 rounded-lg">
                <i className="fa-solid fa-chart-line mr-2"></i> Seller Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-bold text-purple-900 bg-purple-100 rounded-lg">
                <i className="fa-solid fa-user-shield mr-2"></i> Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
