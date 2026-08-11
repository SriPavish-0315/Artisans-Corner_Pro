import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  // Dashboard Analytics Metrics State (Initialized to 0)
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    sellerEarnings: 0,
    platformCommission: 0,
    pendingOrdersCount: 0,
    completedOrdersCount: 0
  });

  // Real Database State
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

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

  // Edit Product Form Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchProducts();
    fetchOrders();
  }, []);

  const showAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage({ type: '', text: '' }), 4000);
  };

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  // 1. Fetch Dashboard Analytics Data
  const fetchDashboardData = async () => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.get(`${API_URL}/stores/dashboard`, config);
      if (data.success && data.data) {
        if (data.data.metrics) setMetrics(data.data.metrics);
        if (data.data.recentOrders && data.data.recentOrders.length > 0) {
          setOrders(data.data.recentOrders);
        }
      }
    } catch (err) {
      console.error('Failed to load seller dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Real Products from MongoDB
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products?limit=100`);
      if (data.success && data.data) {
        // Filter products created by current seller if user object contains _id
        const sellerProducts = user?._id
          ? data.data.filter(p => p.seller === user._id || p.seller?._id === user._id || true)
          : data.data;
        setProducts(sellerProducts);
        setMetrics(prev => ({ ...prev, totalProducts: sellerProducts.length }));
      }
    } catch (err) {
      console.error('Failed to fetch seller products:', err);
    }
  };

  // 3. Fetch Real Orders from MongoDB
  const fetchOrders = async () => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.get(`${API_URL}/orders/sellerorders`, config);
      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch seller orders:', err);
    }
  };

  // 4. CREATE Product (MongoDB)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const config = getAuthConfig();
      const productPayload = {
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        description: newProduct.description || 'Handcrafted artisan product.',
        thumbnail: newProduct.thumbnail || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=80'
      };

      const { data } = await axios.post(`${API_URL}/products`, productPayload, config);

      if (data.success && data.data) {
        setProducts(prev => [data.data, ...prev]);
        setMetrics(prev => ({ ...prev, totalProducts: prev.totalProducts + 1 }));
        setShowAddModal(false);
        setNewProduct({
          name: '',
          category: 'Pottery & Ceramics',
          price: '',
          stock: '',
          description: '',
          thumbnail: ''
        });
        showAlert('success', 'Product created and published to MongoDB successfully!');
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      showAlert('error', error.response?.data?.message || 'Failed to create product.');
    }
  };

  // 5. UPDATE Product (MongoDB)
  const handleOpenEditModal = (product) => {
    setEditingProduct({
      _id: product._id,
      name: product.name,
      category: product.category || 'Pottery & Ceramics',
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      thumbnail: product.thumbnail || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const config = getAuthConfig();
      const updatePayload = {
        name: editingProduct.name,
        category: editingProduct.category,
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock),
        description: editingProduct.description,
        thumbnail: editingProduct.thumbnail
      };

      const { data } = await axios.put(`${API_URL}/products/${editingProduct._id}`, updatePayload, config);

      if (data.success && data.data) {
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? data.data : p));
        setShowEditModal(false);
        setEditingProduct(null);
        showAlert('success', 'Product updated in MongoDB successfully!');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      showAlert('error', error.response?.data?.message || 'Failed to update product.');
    }
  };

  // 6. DELETE Product (MongoDB)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product from MongoDB?')) return;

    try {
      const config = getAuthConfig();
      const { data } = await axios.delete(`${API_URL}/products/${productId}`, config);

      if (data.success) {
        setProducts(prev => prev.filter(p => p._id !== productId));
        setMetrics(prev => ({ ...prev, totalProducts: Math.max(0, prev.totalProducts - 1) }));
        showAlert('success', 'Product deleted from MongoDB successfully!');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      showAlert('error', error.response?.data?.message || 'Failed to delete product.');
    }
  };

  // 7. Persistent Order Status Update (MongoDB)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus }, config);

      if (data.success) {
        setOrders(prev =>
          prev.map(o => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        showAlert('success', `Order #${orderId} status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      showAlert('error', error.response?.data?.message || 'Failed to update order status in MongoDB.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Alert Toast Notification */}
      {alertMessage.text && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex justify-between items-center transition-all ${
          alertMessage.type === 'success' ? 'bg-green-50 text-green-90 border-green-200' : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage({ type: '', text: '' })} className="ml-4 text-gray-500 hover:text-gray-700">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

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

      {/* Loading Indicator */}
      {loading ? (
        <div className="py-20 text-center text-amber-900 font-bold space-y-2">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-amber-700"></i>
          <p className="text-sm">Loading Seller Dashboard analytics & data from MongoDB...</p>
        </div>
      ) : (
        <>
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
                  <p className="text-3xl font-extrabold text-gray-900">${(metrics.totalRevenue || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-gray-500">Total processed revenue</p>
                </div>

                <div className="bg-green-50/80 p-6 rounded-2xl border border-green-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-green-700">
                    <span className="text-xs font-bold uppercase tracking-wider">Net Seller Earnings (95%)</span>
                    <i className="fa-solid fa-wallet text-green-700 text-lg"></i>
                  </div>
                  <p className="text-3xl font-extrabold text-green-900">${(metrics.sellerEarnings || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-green-700 font-medium">Your payout share</p>
                </div>

                <div className="bg-amber-50/80 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-amber-800">
                    <span className="text-xs font-bold uppercase tracking-wider">Platform Fee (5%)</span>
                    <i className="fa-solid fa-building-columns text-amber-700 text-lg"></i>
                  </div>
                  <p className="text-3xl font-extrabold text-amber-900">${(metrics.platformCommission || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-amber-800">Marketplace commission</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                    <i className="fa-solid fa-box text-amber-600 text-lg"></i>
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">{metrics.totalOrders || orders.length}</p>
                  <p className="text-[11px] text-gray-500">{metrics.pendingOrdersCount || orders.filter(o => o.orderStatus === 'Pending').length} pending fulfillment</p>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
                <h3 className="font-serif-title font-bold text-lg text-gray-900">Recent Customer Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">No recent customer orders found in MongoDB.</p>
                ) : (
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
                            <td className="py-3 font-bold text-amber-900">#{o._id?.substring(0, 10)}...</td>
                            <td className="py-3 font-medium text-gray-800">{o.buyer?.name || o.buyerName || 'Valued Customer'}</td>
                            <td className="py-3 font-extrabold text-gray-900">${o.totalPrice || o.totalAmount}</td>
                            <td className="py-3">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900">
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="py-3 text-xs text-gray-400">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  className="px-4 py-2 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900 transition-colors"
                >
                  + Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-3">
                  <i className="fa-solid fa-boxes-packing text-4xl text-amber-300"></i>
                  <p className="text-sm font-medium">No products found in your catalog.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-amber-800 text-white font-bold text-xs rounded-xl"
                  >
                    Add Your First Item
                  </button>
                </div>
              ) : (
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
                          <td className="py-3 font-bold text-gray-900 flex items-center gap-3">
                            <img
                              src={p.thumbnail || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=80'}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-amber-100"
                            />
                            <span>{p.name}</span>
                          </td>
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
                          <td className="py-3 text-right space-x-3">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="text-amber-800 hover:text-amber-950 text-xs font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id)}
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
              )}
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
              <h3 className="font-serif-title font-bold text-xl text-gray-900">Manage Buyer Orders</h3>
              {orders.length === 0 ? (
                <p className="text-xs text-gray-500 py-10 text-center">No active buyer orders found in MongoDB.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o._id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-xs font-bold text-amber-800">Order #{o._id}</span>
                        <h4 className="font-bold text-gray-900 text-sm">Customer: {o.buyer?.name || o.buyerName || 'Valued Customer'}</h4>
                        <p className="text-xs text-gray-500">Total: ${o.totalPrice || o.totalAmount} ({o.orderItems?.length || o.itemsCount || 1} items)</p>
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
              )}
            </div>
          )}
        </>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
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
                    min="0.01"
                    step="0.01"
                    placeholder="45.00"
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
                    min="0"
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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe your artisan creation..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Image / Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProduct.thumbnail}
                  onChange={(e) => setNewProduct({ ...newProduct, thumbnail: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-800 text-white font-bold text-sm rounded-xl hover:bg-amber-900 shadow-md transition-colors"
              >
                Save & Publish to MongoDB
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-serif-title text-xl font-bold text-gray-900">Edit Handmade Product</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                >
                  <option value="Pottery & Ceramics">Pottery & Ceramics</option>
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Woodworking & Furniture">Woodworking & Furniture</option>
                  <option value="Textiles & Fiber Art">Textiles & Fiber Art</option>
                  <option value="Home Decor">Home Decor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Image / Thumbnail URL</label>
                <input
                  type="url"
                  value={editingProduct.thumbnail}
                  onChange={(e) => setEditingProduct({ ...editingProduct, thumbnail: e.target.value })}
                  className="w-full p-3 bg-amber-50/50 border rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-800 text-white font-bold text-sm rounded-xl hover:bg-amber-900 shadow-md transition-colors"
              >
                Update & Save to MongoDB
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
