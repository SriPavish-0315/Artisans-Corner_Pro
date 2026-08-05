import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  const [orders] = useState([
    {
      _id: 'ord_101',
      createdAt: '2026-07-28',
      totalPrice: 92.08,
      orderStatus: 'Processing',
      isPaid: true,
      itemsCount: 2
    },
    {
      _id: 'ord_98',
      createdAt: '2026-07-10',
      totalPrice: 128.50,
      orderStatus: 'Delivered',
      isPaid: true,
      itemsCount: 1
    }
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <img
          src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
          alt={user?.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-amber-700 shadow-md"
        />
        <div className="text-center sm:text-left flex-1">
          <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {user?.role || 'Buyer'} Account
          </span>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{user?.name || 'Jane Buyer'}</h1>
          <p className="text-xs text-gray-500">{user?.email || 'buyer@example.com'}</p>
        </div>

        {user?.role === 'buyer' && (
          <Link
            to="/become-seller"
            className="px-5 py-2.5 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900 transition-colors shadow-xs"
          >
            <i className="fa-solid fa-store mr-1.5"></i> Become a Seller
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200 space-x-8 text-sm font-bold text-gray-600">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'orders' ? 'border-amber-800 text-amber-900 font-extrabold' : 'border-transparent'}`}
        >
          <i className="fa-solid fa-box mr-2"></i> My Order History
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'settings' ? 'border-amber-800 text-amber-900 font-extrabold' : 'border-transparent'}`}
        >
          <i className="fa-solid fa-gear mr-2"></i> Account Settings
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
          <h3 className="font-serif-title font-bold text-xl text-gray-900">Past Orders</h3>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord._id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-800">Order #{ord._id}</span>
                  <p className="text-xs text-gray-500">Placed on {ord.createdAt} • {ord.itemsCount} Items</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-1">${ord.totalPrice}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    ord.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ord.orderStatus}
                  </span>
                  <Link
                    to={`/order/${ord._id}`}
                    className="px-4 py-2 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-serif-title font-bold text-xl text-gray-900">Edit Personal Information</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Profile updated!'); }}>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input type="text" defaultValue={user?.name} className="w-full p-3 bg-amber-50/40 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input type="email" defaultValue={user?.email} className="w-full p-3 bg-amber-50/40 border rounded-xl text-sm" />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-amber-800 text-white font-bold text-xs rounded-xl">
              Save Changes
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default Profile;
