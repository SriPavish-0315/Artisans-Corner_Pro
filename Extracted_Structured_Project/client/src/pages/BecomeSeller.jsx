import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BecomeSeller = () => {
  const { user, updateRoleToSeller } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    logoUrl: '',
    bannerUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const { data } = await axios.post('http://localhost:5000/api/stores', formData, config);
      
      if (data.success) {
        updateRoleToSeller(data.data);
        navigate('/seller/dashboard');
      }
    } catch (err) {
      // Demo Mode onboarding
      const demoStore = {
        _id: 's_' + Date.now(),
        storeName: formData.storeName || 'My Handcrafted Studio',
        storeDescription: formData.storeDescription || 'Quality artisan goods.',
        logoUrl: formData.logoUrl || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=200&q=80',
        bannerUrl: formData.bannerUrl || 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80'
      };
      updateRoleToSeller(demoStore);
      navigate('/seller/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      
      {/* Header Callout */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-950 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl border border-amber-800">
        <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-800/60 px-3 py-1 rounded-full border border-amber-700">
          Artisan Seller Onboarding
        </span>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold">Open Your Store on Artisan's Corner</h1>
        <p className="text-amber-100/80 text-sm max-w-xl mx-auto">
          Create your branded storefront, showcase handmade goods, and enjoy a fair 5% platform commission rate with 95% earnings payout.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-md">
        {error && <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Store Name *</label>
            <input
              type="text"
              name="storeName"
              placeholder="e.g. Kyoto Stoneware & Clay"
              value={formData.storeName}
              onChange={handleChange}
              required
              className="w-full p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Store Description *</label>
            <textarea
              name="storeDescription"
              rows="4"
              placeholder="Tell buyers about your craftsmanship, materials, and passion..."
              value={formData.storeDescription}
              onChange={handleChange}
              required
              className="w-full p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Store Logo Image URL</label>
              <input
                type="url"
                name="logoUrl"
                placeholder="https://..."
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Store Banner Image URL</label>
              <input
                type="url"
                name="bannerUrl"
                placeholder="https://..."
                value={formData.bannerUrl}
                onChange={handleChange}
                className="w-full p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <i className="fa-solid fa-shield-halved text-amber-700 mr-1"></i> No upfront listing fees. Pay 5% only upon completed sale.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              {loading ? 'Creating Store...' : 'Launch My Store Now →'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default BecomeSeller;
