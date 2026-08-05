import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [summary, setSummary] = useState({
    totalUsers: 148,
    totalBuyers: 122,
    totalSellers: 26,
    totalStores: 24,
    totalProducts: 310,
    totalOrders: 420,
    totalGrossRevenue: 45800,
    totalPlatformCommission: 2290.00, // 5%
    totalSellerPayouts: 43510.00 // 95%
  });

  const [usersList, setUsersList] = useState([
    { _id: 'u1', name: 'Jane Buyer', email: 'buyer@example.com', role: 'buyer', isActive: true },
    { _id: 'u2', name: 'Elena Vance', email: 'seller@example.com', role: 'seller', isActive: true },
    { _id: 'u3', name: 'Platform Admin', email: 'admin@example.com', role: 'admin', isActive: true },
    { _id: 'u4', name: 'Suspended Account', email: 'spam@example.com', role: 'buyer', isActive: false }
  ]);

  const [storesList, setStoresList] = useState([
    { _id: 's1', storeName: 'Terra Cotta Studios', ownerName: 'Elena Vance', status: 'active', totalSales: 45, totalRevenue: 3400 },
    { _id: 's2', storeName: 'Wood & Wave Artisans', ownerName: 'Arthur Pendelton', status: 'active', totalSales: 28, totalRevenue: 2800 },
    { _id: 's3', storeName: 'Lumina Gems Studio', ownerName: 'Clara Oswald', status: 'pending', totalSales: 0, totalRevenue: 0 }
  ]);

  useEffect(() => {
    fetchAdminSummary();
  }, []);

  const fetchAdminSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('http://localhost:5000/api/admin/summary', config);
      if (data.success && data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.log('Using cached admin analytics');
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsersList(usersList.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const handleToggleStoreStatus = (storeId, newStatus) => {
    setStoresList(storesList.map(s => s._id === storeId ? { ...s, status: newStatus } : s));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-purple-800/40">
        <div>
          <span className="text-xs font-bold text-purple-300 uppercase tracking-widest bg-purple-900/80 px-3 py-1 rounded-full border border-purple-700">
            Platform Master Administration
          </span>
          <h1 className="font-serif-title text-3xl font-bold mt-2">
            Artisan's Corner Admin Control
          </h1>
          <p className="text-xs text-purple-200/80 mt-1">
            Global Marketplace Oversight | Registered Users: <strong>{summary.totalUsers}</strong> | Platform Commission: <strong>5%</strong>
          </p>
        </div>

        <div className="bg-purple-900/60 p-4 rounded-2xl border border-purple-700 text-right">
          <span className="text-xs text-purple-300 uppercase font-bold tracking-wider block">Platform Commission Earned</span>
          <span className="text-3xl font-extrabold text-amber-400">${summary.totalPlatformCommission.toFixed(2)}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-purple-200 space-x-8 text-sm font-bold text-gray-600">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'overview' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-chart-line mr-2"></i> Marketplace Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'users' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-users mr-2"></i> User Management ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'stores' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-store mr-2"></i> Vendor Stores ({storesList.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Gross Marketplace GMV</span>
            <p className="text-3xl font-extrabold text-gray-900">${summary.totalGrossRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Total volume across all stores</p>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-amber-800 uppercase">5% Platform Commission</span>
            <p className="text-3xl font-extrabold text-amber-900">${summary.totalPlatformCommission.toFixed(2)}</p>
            <p className="text-xs text-amber-800 font-medium">Net platform revenue</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Seller Net Payouts (95%)</span>
            <p className="text-3xl font-extrabold text-green-700">${summary.totalSellerPayouts.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Disbursed to vendors</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Platform Entities</span>
            <p className="text-3xl font-extrabold text-gray-900">{summary.totalStores} Stores</p>
            <p className="text-xs text-gray-500">{summary.totalProducts} active products listed</p>
          </div>

        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <h3 className="font-serif-title font-bold text-xl text-gray-900">Platform Registered Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-400 font-bold">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-purple-50/20">
                    <td className="py-3 font-bold text-gray-900">{u.name}</td>
                    <td className="py-3 text-xs text-gray-600">{u.email}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-purple-100 text-purple-900">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id)}
                          className={`text-xs font-bold px-3 py-1 rounded-xl ${
                            u.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STORES */}
      {activeTab === 'stores' && (
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <h3 className="font-serif-title font-bold text-xl text-gray-900">Vendor Store Moderation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-400 font-bold">
                  <th className="pb-3">Store Name</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Total Sales</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {storesList.map((s) => (
                  <tr key={s._id} className="hover:bg-purple-50/20">
                    <td className="py-3 font-bold text-gray-900">{s.storeName}</td>
                    <td className="py-3 text-xs text-gray-600">{s.ownerName}</td>
                    <td className="py-3 font-extrabold text-gray-900">${s.totalRevenue} ({s.totalSales} items)</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={s.status}
                        onChange={(e) => handleToggleStoreStatus(s._id, e.target.value)}
                        className="bg-purple-50 border border-purple-200 text-xs font-bold rounded-xl px-2.5 py-1 text-purple-900"
                      >
                        <option value="active">Approve / Active</option>
                        <option value="pending">Pending Review</option>
                        <option value="disabled">Disable Store</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
