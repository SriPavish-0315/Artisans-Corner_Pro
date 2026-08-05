import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [metrics, setMetrics] = useState({
    totalProducts: 4,
    totalOrders: 18,
    totalRevenue: 2450,
    sellerEarnings: 2327.50, // 95%
    platformCommission: 122.50, // 5%
    pendingOrdersCount: 3,
    completedOrdersCount: 15
  });

  const [products, setProducts] = useState([
    { _id: 'p1', name: 'Hand-thrown Speckled Ceramic Mug', category: 'Pottery & Ceramics', price: 38, stock: 12, status: 'active' },
    { _id: 'p2', name: 'Raw Stoneware Teapot', category: 'Pottery & Ceramics', price: 85, stock: 4, status: 'active' },
    { _id: 'p3', name: 'Ceramic Serving Bowl Set', category: 'Pottery & Ceramics', price: 62, stock: 0, status: 'out_of_stock' }
  ]);

  const [orders, setOrders] = useState([
    { _id: 'ord_101', buyerName: 'Jane Buyer', itemsCount: 2, totalAmount: 76, orderStatus: 'Pending', createdAt: '2026-07-28' },
    { _id: 'ord_102', buyerName: 'Mark Vance', itemsCount: 1, totalAmount: 85, orderStatus: 'Processing', createdAt: '2026-07-27' },
    { _id: 'ord_103', buyerName: 'Sarah Miller', itemsCount: 3, totalAmount: 162, orderStatus: 'Delivered', createdAt: '2026-07-24' }
  ]);

  // Add Product Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Pottery & Ceramics',
    price: '',
    stock: '',
    description: '',
    thumbnail: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('http://localhost:5000/api/stores/dashboard', config);
      if (data.success && data.data) {
        setMetrics(data.data.metrics);
        if (data.data.recentOrders) setOrders(data.data.recentOrders);
      }
    } catch (err) {
      console.log('Using cached seller dashboard analytics state');
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const created = {
      _id: 'p_' + Date.now(),
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      status: 'active'
    };
    setProducts([created, ...products]);
    setMetrics(prev => ({ ...prev, totalProducts: prev.totalProducts + 1 }));
    setShowAddModal(false);
    setNewProduct({ name: '', category: 'Pottery & Ceramics', price: '', stock: '', description: '', thumbnail: '' });
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-950 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div>
          <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-800/60 px-3 py-1 rounded-full border border-amber-700">
            Vendor Control Center
          </span>
          <h1 className="font-serif-title text-3xl font-bold mt-2">
            Welcome, {user?.name || 'Master Craftsman'}!
          </h1>
          <p className="text-xs text-amber-200/80 mt-1">
            Store: <strong className="text-white">{user?.store?.storeName || 'Terra Cotta Studios'}</strong> | Commission Rate: <strong>5%</strong>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-amber-400 text-amber-950 font-bold text-xs rounded-xl hover:bg-amber-300 transition-all shadow-lg flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Add New Product
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-amber-200 space-x-8 text-sm font-bold text-gray-600">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'overview' ? 'border-amber-800 text-amber-900 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-chart-pie mr-2"></i> Dashboard Overview
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'products' ? 'border-amber-800 text-amber-900 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-boxes-stacked mr-2"></i> Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors border-b-2 ${activeTab === 'orders' ? 'border-amber-800 text-amber-900 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-truck-ramp-box mr-2"></i> Manage Orders ({orders.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
                <i className="fa-solid fa-sack-dollar text-amber-600 text-lg"></i>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">${metrics.totalRevenue.toFixed(2)}</p>
              <p className="text-[11px] text-gray-500">Total processed revenue</p>
            </div>

            <div className="bg-green-50/80 p-6 rounded-2xl border border-green-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-green-700">
                <span className="text-xs font-bold uppercase tracking-wider">Net Seller Earnings (95%)</span>
                <i className="fa-solid fa-wallet text-green-700 text-lg"></i>
              </div>
              <p className="text-3xl font-extrabold text-green-900">${metrics.sellerEarnings.toFixed(2)}</p>
              <p className="text-[11px] text-green-700 font-medium">Your payout share</p>
            </div>

            <div className="bg-amber-50/80 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-amber-800">
                <span className="text-xs font-bold uppercase tracking-wider">Platform Fee (5%)</span>
                <i className="fa-solid fa-building-columns text-amber-700 text-lg"></i>
              </div>
              <p className="text-3xl font-extrabold text-amber-900">${metrics.platformCommission.toFixed(2)}</p>
              <p className="text-[11px] text-amber-800">Marketplace commission</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                <i className="fa-solid fa-box text-amber-600 text-lg"></i>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{metrics.totalOrders}</p>
              <p className="text-[11px] text-gray-500">{metrics.pendingOrdersCount} pending fulfillment</p>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
            <h3 className="font-serif-title font-bold text-lg text-gray-900">Recent Customer Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-400 font-bold">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Buyer</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-amber-50/30">
                      <td className="py-3 font-bold text-amber-900">#{o._id}</td>
                      <td className="py-3 font-medium text-gray-800">{o.buyerName || 'Buyer'}</td>
                      <td className="py-3 font-extrabold text-gray-900">${o.totalAmount}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-400">{o.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif-title font-bold text-xl text-gray-900">Your Store Catalog</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-800 text-white font-bold text-xs rounded-xl"
            >
              + Add Product
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-400 font-bold">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-amber-50/30">
                    <td className="py-3 font-bold text-gray-900">{p.name}</td>
                    <td className="py-3 text-xs text-gray-600">{p.category}</td>
                    <td className="py-3 font-extrabold text-gray-900">${p.price}</td>
                    <td className="py-3 font-bold text-gray-700">{p.stock} units</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.stock > 0 ? 'Active' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setProducts(products.filter(item => item._id !== p._id))}
                        className="text-red-600 hover:text-red-800 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
          <h3 className="font-serif-title font-bold text-xl text-gray-900">Manage Buyer Orders</h3>
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o._id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-800">Order #{o._id}</span>
                  <h4 className="font-bold text-gray-900 text-sm">Customer: {o.buyerName || 'Jane Buyer'}</h4>
                  <p className="text-xs text-gray-500">Total: ${o.totalAmount} ({o.itemsCount || 1} items)</p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold text-gray-600">Update Status:</span>
                  <select
                    value={o.orderStatus}
                    onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                    className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-900 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-serif-title text-xl font-bold text-gray-900">Add New Handmade Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hand-carved Oak Salad Bowl"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    placeholder="45"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                >
                  <option value="Pottery & Ceramics">Pottery & Ceramics</option>
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Woodworking & Furniture">Woodworking & Furniture</option>
                  <option value="Textiles & Fiber Art">Textiles & Fiber Art</option>
                  <option value="Home Decor">Home Decor</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-800 text-white font-bold text-sm rounded-xl hover:bg-amber-900 shadow-md"
              >
                Save & Publish Item
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
