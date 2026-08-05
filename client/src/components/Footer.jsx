import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-amber-100/80 pt-16 pb-8 border-t-4 border-amber-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Description */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white font-bold">
              <i className="fa-solid fa-shapes text-xl"></i>
            </div>
            <span className="font-serif-title text-2xl font-bold text-white tracking-wide">
              Artisan's<span className="text-amber-500">Corner</span>
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            The premier multi-vendor marketplace celebrating authentic craftsmanship, handmade ceramics, custom jewelry, fine woodworking, and unique artisan goods.
          </p>
          <div className="flex space-x-4 pt-2">
            <a href="#instagram" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-amber-400 hover:bg-amber-600 hover:text-white transition-colors">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#pinterest" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-amber-400 hover:bg-amber-600 hover:text-white transition-colors">
              <i className="fa-brands fa-pinterest"></i>
            </a>
            <a href="#facebook" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-amber-400 hover:bg-amber-600 hover:text-white transition-colors">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wider uppercase text-xs border-b border-amber-800/60 pb-2">
            Categories
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products?category=Pottery%20%26%20Ceramics" className="hover:text-amber-400 transition-colors">Pottery & Ceramics</Link></li>
            <li><Link to="/products?category=Jewelry%20%26%20Accessories" className="hover:text-amber-400 transition-colors">Jewelry & Accessories</Link></li>
            <li><Link to="/products?category=Woodworking%20%26%20Furniture" className="hover:text-amber-400 transition-colors">Woodworking & Furniture</Link></li>
            <li><Link to="/products?category=Textiles%20%26%20Fiber%20Art" className="hover:text-amber-400 transition-colors">Textiles & Fiber Art</Link></li>
            <li><Link to="/products?category=Home%20Decor" className="hover:text-amber-400 transition-colors">Home Decor & Candles</Link></li>
          </ul>
        </div>

        {/* Platform Policy & Fee Structure */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wider uppercase text-xs border-b border-amber-800/60 pb-2">
            Multi-Vendor Platform
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/become-seller" className="hover:text-amber-400 transition-colors font-medium text-amber-300">Open an Artisan Store</Link></li>
            <li><span className="text-gray-400">Platform Commission: <strong>5%</strong></span></li>
            <li><span className="text-gray-400">Seller Earnings: <strong>95%</strong></span></li>
            <li><Link to="/products" className="hover:text-amber-400 transition-colors">Browse Verified Vendors</Link></li>
            <li><a href="#faq" className="hover:text-amber-400 transition-colors">Seller Protection & Policy</a></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wider uppercase text-xs border-b border-amber-800/60 pb-2">
            Artisan Dispatch
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            Subscribe for stories from master craftsmen and exclusive seasonal collection launches.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3.5 py-2 rounded-lg bg-white/5 border border-amber-800/50 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs py-2.5 uppercase tracking-wider rounded-lg transition-colors shadow"
            >
              Subscribe
            </button>
          </form>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-white/10 text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 Artisan's Corner Marketplace Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:underline">Privacy Policy</a>
          <a href="#terms" className="hover:underline">Terms of Service</a>
          <a href="#security" className="hover:underline">Security Standards</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
