import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MOCK_CATALOG, CATEGORY_NAMES } from '../data/catalogData';
import CloudinaryUploader from '../components/CloudinaryUploader';

const AdminDashboard = () => {
  const { user, triggerEmailNotification } = useAuth();
  const [activeTab, setActiveTab] = useState('products'); // Default to Product & Stock Management

  const [summary, setSummary] = useState({
    totalUsers: 148,
    totalBuyers: 122,
    totalSellers: 26,
    totalStores: 24,
    totalProducts: MOCK_CATALOG.length,
    totalOrders: 420,
    totalGrossRevenue: 45800,
    totalPlatformCommission: 2290.00, // 5%
    totalSellerPayouts: 43510.00 // 95%
  });

  const [usersList, setUsersList] = useState(() => {
    const registered = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    return registered.map(u => ({ ...u, isActive: true }));
  });

  const [storesList, setStoresList] = useState([
    { _id: 's1', storeName: 'Terra Cotta Studios', ownerName: 'Artisan Seller', status: 'active', totalSales: 45, totalRevenue: 3400 },
    { _id: 's2', storeName: 'Wood & Wave Artisans', ownerName: 'Craftsman Studio', status: 'active', totalSales: 28, totalRevenue: 2800 },
    { _id: 's3', storeName: 'Lumina Gems Studio', ownerName: 'Gemstone Artisan', status: 'pending', totalSales: 0, totalRevenue: 0 }
  ]);

  // Product & Stock Management State
  const [productsList, setProductsList] = useState(() => {
    return MOCK_CATALOG.map((p, idx) => ({
      ...p,
      stock: p.stock !== undefined ? p.stock : (idx % 7 === 0 ? 0 : idx % 4 === 0 ? 3 : 15 + (idx % 10)),
      sku: p.sku || `${(p.category || 'ART').substring(0,3).toUpperCase()}-${p._id.toUpperCase()}`
    }));
  });

  // Door Delivery Assignment State
  const [assignedDeliveries, setAssignedDeliveries] = useState(() => {
    const saved = localStorage.getItem('artisans_assigned_deliveries');
    return saved ? JSON.parse(saved) : [];
  });

  // Global Paid Orders Management State for Admin
  const [ordersList, setOrdersList] = useState(() => {
    const saved = localStorage.getItem('artisans_global_orders');
    return saved ? JSON.parse(saved) : [
      {
        _id: 'ORD-8921',
        buyerName: 'Jane Buyer',
        buyerEmail: 'buyer@example.com',
        buyerPhone: '+1 (555) 234-5678',
        totalAmount: 128.50,
        paymentStatus: 'Paid',
        paymentMethod: 'Stripe Credit Card (256-bit SSL)',
        transactionId: 'pi_stripe_3M92019482',
        orderStatus: 'Out for Delivery',
        itemsCount: 3,
        shippingAddress: { street: '742 Evergreen Terrace', city: 'Springfield', state: 'IL' },
        createdAt: '2026-08-10 14:00'
      },
      {
        _id: 'ORD-7714',
        buyerName: 'Michael Scott',
        buyerEmail: 'mscott@example.com',
        buyerPhone: '+1 (555) 987-6543',
        totalAmount: 45.00,
        paymentStatus: 'Paid',
        paymentMethod: 'Stripe Credit Card (256-bit SSL)',
        transactionId: 'pi_stripe_8814720192',
        orderStatus: 'Processing',
        itemsCount: 1,
        shippingAddress: { street: '1725 Slough Avenue', city: 'Scranton', state: 'PA' },
        createdAt: '2026-08-10 15:30'
      }
    ];
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    deliveryAddress: '',
    productName: '',
    driverEmail: '',
    driverName: '',
    expectedTime: 'Today by 5:30 PM'
  });

  const handleAssignDriverSubmit = (e) => {
    e.preventDefault();
    const driverObj = usersList.find(u => u.email === deliveryForm.driverEmail) || { name: deliveryForm.driverName || 'Driver', email: deliveryForm.driverEmail || '' };

    const newAssignment = {
      id: 'DEL-' + Math.floor(1000 + Math.random() * 9000),
      orderId: deliveryForm.orderId || ('ORD-' + Math.floor(1000 + Math.random() * 9000)),
      buyerName: deliveryForm.buyerName || 'Customer',
      buyerEmail: deliveryForm.buyerEmail || '',
      buyerPhone: deliveryForm.buyerPhone || '',
      deliveryAddress: deliveryForm.deliveryAddress || 'Customer Address',
      productName: deliveryForm.productName || 'Handcrafted Artisan Goods',
      driverName: driverObj.name,
      driverEmail: driverObj.email,
      expectedTime: deliveryForm.expectedTime || 'Today by 5:00 PM',
      status: 'Out for Delivery',
      assignedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      deliveredAt: '',
      deliveryPlace: '',
      deliveryNotes: ''
    };

    const updated = [newAssignment, ...assignedDeliveries];
    setAssignedDeliveries(updated);
    localStorage.setItem('artisans_assigned_deliveries', JSON.stringify(updated));

    if (triggerEmailNotification) {
      triggerEmailNotification(
        driverObj.email,
        '🚚 New Order Delivery Assignment',
        `Admin assigned Order ${newAssignment.orderId} to you. Deliver to ${newAssignment.buyerName} by ${newAssignment.expectedTime}.`,
        'delivery'
      );
    }

    showToast(`Order ${newAssignment.orderId} assigned to ${driverObj.name}! Email alert sent to ${driverObj.email}.`);
    setShowAssignModal(false);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState('all');

  // Modal & Notification States
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [editProductTarget, setEditProductTarget] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Pottery & Ceramics',
    price: '',
    stock: 12,
    sku: '',
    storeName: 'Artisan Workshop',
    thumbnail: '',
    description: ''
  });

  useEffect(() => {
    fetchAdminSummary();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchAdminSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`${API_URL}/admin/summary`, config);
      if (data.success && data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.log('Using cached admin analytics');
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsersList(usersList.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
    showToast('User status updated');
  };

  const handleToggleStoreStatus = (storeId, newStatus) => {
    setStoresList(storesList.map(s => s._id === storeId ? { ...s, status: newStatus } : s));
    showToast('Store status updated');
  };

  // Stock Adjustment (+ / -)
  const handleStockChange = (id, delta) => {
    const updated = productsList.map(p => {
      if (p._id === id) {
        const newStock = Math.max(0, (p.stock || 0) + delta);
        return { ...p, stock: newStock };
      }
      return p;
    });
    setProductsList(updated);

    const catItem = MOCK_CATALOG.find(p => p._id === id);
    if (catItem) catItem.stock = Math.max(0, (catItem.stock || 0) + delta);
  };

  // Add Product Submit
  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert('Please provide product name and price.');
      return;
    }

    const createdId = 'adm_' + Date.now();
    const createdItem = {
      _id: createdId,
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock) || 10,
      sku: newProduct.sku || `ADM-${createdId.slice(-4).toUpperCase()}`,
      averageRating: 5.0,
      totalReviews: 1,
      thumbnail: newProduct.thumbnail || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      store: { storeName: newProduct.storeName || 'Artisan Workshop' },
      description: newProduct.description || 'Handcrafted premium quality product added by admin.'
    };

    setProductsList([createdItem, ...productsList]);
    MOCK_CATALOG.unshift(createdItem);

    setShowAddModal(false);
    setNewProduct({
      name: '',
      category: 'Pottery & Ceramics',
      price: '',
      stock: 12,
      sku: '',
      storeName: 'Artisan Workshop',
      thumbnail: '',
      description: ''
    });
    showToast(`Product "${createdItem.name}" added successfully to the catalog!`);
  };

  // Delete Product
  const confirmDeleteProduct = () => {
    if (!deleteProductTarget) return;
    const targetId = deleteProductTarget._id;
    const updated = productsList.filter(p => p._id !== targetId);
    setProductsList(updated);

    const idx = MOCK_CATALOG.findIndex(p => p._id === targetId);
    if (idx !== -1) MOCK_CATALOG.splice(idx, 1);

    showToast(`Product "${deleteProductTarget.name}" deleted from store.`);
    setDeleteProductTarget(null);
  };

  // Edit Product Submit
  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    if (!editProductTarget) return;

    const updated = productsList.map(p => {
      if (p._id === editProductTarget._id) {
        return {
          ...editProductTarget,
          price: Number(editProductTarget.price),
          stock: Number(editProductTarget.stock)
        };
      }
      return p;
    });
    setProductsList(updated);

    const catItem = MOCK_CATALOG.find(p => p._id === editProductTarget._id);
    if (catItem) {
      catItem.name = editProductTarget.name;
      catItem.category = editProductTarget.category;
      catItem.price = Number(editProductTarget.price);
      catItem.stock = Number(editProductTarget.stock);
    }

    showToast(`Product "${editProductTarget.name}" updated successfully.`);
    setEditProductTarget(null);
  };

  // Filter Products
  const filteredProducts = productsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.store?.storeName && p.store.storeName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All Categories' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = p.stock > 5;
    if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 5;
    if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calculate Stock Analytics
  const totalStockUnits = productsList.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockCount = productsList.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = productsList.filter(p => p.stock === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-700 flex items-center gap-3 animate-slideUp">
          <i className="fa-solid fa-circle-check text-green-400 text-lg"></i>
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-purple-800/40">
        <div>
          <span className="text-xs font-bold text-purple-300 uppercase tracking-widest bg-purple-900/80 px-3 py-1 rounded-full border border-purple-700">
            Master Admin Dashboard
          </span>
          <h1 className="font-serif-title text-3xl font-bold mt-2">
            Artisan's Corner Admin Control
          </h1>
          <p className="text-xs text-purple-200/80 mt-1">
            Global Marketplace Oversight | Catalog Items: <strong>{productsList.length}</strong> | Total Units: <strong>{totalStockUnits}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-plus text-sm"></i> Add New Product
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-purple-200 space-x-6 text-sm font-bold text-gray-600 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors border-b-2 shrink-0 ${activeTab === 'products' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-boxes-stacked mr-2"></i> Stock & Product Control ({productsList.length})
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 shrink-0 ${activeTab === 'overview' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-chart-line mr-2"></i> Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors border-b-2 shrink-0 ${activeTab === 'users' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-users mr-2"></i> Users ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-3 transition-colors border-b-2 shrink-0 ${activeTab === 'stores' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-store mr-2"></i> Vendor Stores ({storesList.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors border-b-2 shrink-0 ${activeTab === 'orders' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-receipt mr-2 text-emerald-600"></i> Buyer Paid Orders ({ordersList.length})
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 transition-colors border-b-2 shrink-0 ${activeTab === 'deliveries' ? 'border-purple-900 text-purple-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-truck-fast mr-2 text-blue-700"></i> Door Delivery Assignment ({assignedDeliveries.length})
        </button>
      </div>

      {/* TAB 1: PRODUCT & STOCK MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          
          {/* Stock Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Total Products</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{productsList.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center text-xl">
                <i className="fa-solid fa-box-open"></i>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Warehouse Units</span>
                <p className="text-2xl font-extrabold text-green-700 mt-1">{totalStockUnits} units</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-800 flex items-center justify-center text-xl">
                <i className="fa-solid fa-cubes"></i>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase">Low Stock (≤5)</span>
                <p className="text-2xl font-extrabold text-amber-900 mt-1">{lowStockCount} items</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-700 uppercase">Out of Stock (0)</span>
                <p className="text-2xl font-extrabold text-red-800 mt-1">{outOfStockCount} items</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center text-xl">
                <i className="fa-solid fa-circle-xmark"></i>
              </div>
            </div>
          </div>

          {/* Search, Filter & Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-xs text-gray-400"></i>
              <input
                type="text"
                placeholder="Search product by name, SKU, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-700"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border border-purple-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none w-full md:w-auto"
            >
              {CATEGORY_NAMES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Stock Status Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-gray-50 border border-purple-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none w-full md:w-auto"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt;5)</option>
              <option value="low_stock">Low Stock (1-5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Add Product Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 w-full md:w-auto justify-center"
            >
              <i className="fa-solid fa-plus text-xs"></i> Add Product
            </button>
          </div>

          {/* Products Stock Table */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-serif-title font-bold text-gray-900 text-base">
                Stock Catalog ({filteredProducts.length} items showing)
              </h3>
              <span className="text-xs text-gray-400">Manage stock quantities, prices, and delete items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-purple-50/50 text-[11px] uppercase text-purple-900 font-extrabold border-b border-purple-100">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500 font-bold text-sm">
                        No products match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((item) => (
                      <tr key={item._id} className="hover:bg-purple-50/20 transition-colors">
                        
                        {/* Item Name & Image */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-11 h-11 rounded-xl object-cover border border-purple-100 shrink-0"
                            />
                            <div>
                              <Link to={`/product/${item._id}`} className="font-bold text-gray-900 hover:text-purple-800 text-sm line-clamp-1">
                                {item.name}
                              </Link>
                              <div className="flex items-center text-[10px] text-amber-500 gap-1 mt-0.5">
                                <i className="fa-solid fa-star"></i>
                                <span className="font-bold text-gray-700">{item.averageRating}</span>
                                <span className="text-gray-400">({item.totalReviews})</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-purple-50 text-purple-900 border border-purple-100">
                            {item.category}
                          </span>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-4 text-xs font-mono text-gray-500 font-semibold">
                          {item.sku}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-extrabold text-gray-900 text-sm">
                          ${item.price}
                        </td>

                        {/* Stock Level & Adjuster */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {/* Stock Badge */}
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              item.stock > 5 ? 'bg-green-100 text-green-800' :
                              item.stock > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' :
                              'bg-red-100 text-red-800 font-black'
                            }`}>
                              {item.stock > 5 ? `${item.stock} in stock` :
                               item.stock > 0 ? `Only ${item.stock} left` :
                               'OUT OF STOCK'}
                            </span>

                            {/* Stock Stepper Buttons */}
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                              <button
                                onClick={() => handleStockChange(item._id, -1)}
                                title="Decrease Stock"
                                className="px-2 py-0.5 text-xs text-gray-600 hover:bg-red-50 hover:text-red-700 font-bold"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleStockChange(item._id, 1)}
                                title="Increase Stock"
                                className="px-2 py-0.5 text-xs text-gray-600 hover:bg-green-50 hover:text-green-700 font-bold border-l border-gray-100"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Vendor */}
                        <td className="py-3 px-4 text-xs text-gray-600 font-medium">
                          {item.store?.storeName || 'Artisan Workshop'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => setEditProductTarget({ ...item })}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-900 transition-colors text-xs"
                              title="Edit Details & Stock"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeleteProductTarget(item)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white transition-colors text-xs"
                              title="Delete Product"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: OVERVIEW / ANALYTICS */}
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
            <p className="text-xs text-gray-500">{productsList.length} total active products</p>
          </div>
        </div>
      )}

      {/* TAB 3: USERS */}
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

      {/* TAB 4: STORES */}
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

      {/* MODAL 1: ADD NEW PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 border border-purple-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-serif-title font-bold text-2xl text-gray-900">Add New Product</h3>
                <p className="text-xs text-gray-500">Create a new item in the marketplace catalog</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handmade Ceramic Flower Pot"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-700"
                  >
                    {CATEGORY_NAMES.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="29.99"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CER-POT-09"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Artisan / Store Name</label>
                <input
                  type="text"
                  placeholder="e.g. Terra Cotta Studios"
                  value={newProduct.storeName}
                  onChange={(e) => setNewProduct({ ...newProduct, storeName: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <div className="space-y-2">
                <CloudinaryUploader
                  label="Upload Product Image (Cloudinary CDN)"
                  onUploadSuccess={(url) => setNewProduct({ ...newProduct, thumbnail: url })}
                />
                <input
                  type="url"
                  placeholder="Or enter direct image URL (https://...)"
                  value={newProduct.thumbnail}
                  onChange={(e) => setNewProduct({ ...newProduct, thumbnail: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Artisan Description</label>
                <textarea
                  rows="3"
                  placeholder="Details about craftsmanship, materials used..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Add Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT MODAL */}
      {editProductTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 border border-purple-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-serif-title font-bold text-2xl text-gray-900">Edit Product & Stock</h3>
                <p className="text-xs text-gray-500">Update item details, stock quantity, and price</p>
              </div>
              <button
                onClick={() => setEditProductTarget(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editProductTarget.name}
                  onChange={(e) => setEditProductTarget({ ...editProductTarget, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={editProductTarget.category}
                    onChange={(e) => setEditProductTarget({ ...editProductTarget, category: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs font-bold"
                  >
                    {CATEGORY_NAMES.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={editProductTarget.price}
                    onChange={(e) => setEditProductTarget({ ...editProductTarget, price: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Current Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editProductTarget.stock}
                  onChange={(e) => setEditProductTarget({ ...editProductTarget, stock: Number(e.target.value) })}
                  className="w-full p-2.5 bg-gray-50 border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-700 font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProductTarget(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: BUYER PAID ORDERS & STRIPE TRANSACTIONS */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-indigo-950 p-6 rounded-3xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md border border-emerald-800/40">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-800/80 px-2.5 py-0.5 rounded-full border border-emerald-600">
                Stripe Payment Transactions & Orders
              </span>
              <h2 className="font-serif-title text-xl font-bold mt-1">Paid Buyer Orders Console</h2>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Real-time oversight of all completed buyer payments, Stripe PaymentIntent IDs, revenue fees, and order processing status.
              </p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-serif-title text-lg font-bold text-purple-950 flex items-center gap-2">
                <i className="fa-solid fa-receipt text-emerald-600"></i> Paid Buyer Transactions ({ordersList.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-50 text-purple-950 font-extrabold uppercase border-b border-purple-100">
                    <th className="p-3">Order #ID</th>
                    <th className="p-3">Buyer Name & Email</th>
                    <th className="p-3">Total Paid</th>
                    <th className="p-3">Payment Method & Stripe ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Logistics Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {ordersList.map((ord) => (
                    <tr key={ord._id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-900">{ord._id}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{ord.buyerName}</p>
                        <p className="text-[11px] text-gray-500">{ord.buyerEmail}</p>
                      </td>
                      <td className="p-3 font-bold text-emerald-800 text-sm">
                        ${(ord.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="bg-green-100 text-green-900 px-2 py-0.5 rounded font-bold">
                          {ord.paymentStatus}
                        </span>
                        <p className="text-gray-400 text-[10px] mt-0.5">{ord.transactionId || 'pi_stripe_3M920'}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">{ord.createdAt}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setDeliveryForm({
                              orderId: ord._id,
                              buyerName: ord.buyerName,
                              buyerEmail: ord.buyerEmail,
                              buyerPhone: ord.buyerPhone || '+1 (555) 234-5678',
                              deliveryAddress: ord.shippingAddress ? `${ord.shippingAddress.street}, ${ord.shippingAddress.city}` : '124 Artisan Way',
                              productName: 'Paid Order Goods Package',
                              driverEmail: 'delivery@example.com',
                              driverName: 'Sam Delivery Driver',
                              expectedTime: 'Today by 5:30 PM'
                            });
                            setActiveTab('deliveries');
                            setShowAssignModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-[11px] shadow-xs flex items-center gap-1.5 ml-auto"
                        >
                          <i className="fa-solid fa-truck-fast"></i> Assign Door Driver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: DOOR DELIVERY ASSIGNMENT & LOGISTICS */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-6 rounded-3xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-800/80 px-2.5 py-0.5 rounded-full border border-blue-600">
                Logistics & Delivery Dispatch
              </span>
              <h2 className="font-serif-title text-xl font-bold mt-1">Assign Orders to Door Delivery Drivers</h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Admin can select registered delivery partners and set expected delivery timestamps. Drivers will update delivery completion logs on their portal.
              </p>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              <i className="fa-solid fa-truck-ramp-box text-sm"></i> Assign New Order Delivery
            </button>
          </div>

          {/* Assigned Deliveries List */}
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
            <h3 className="font-serif-title text-lg font-bold text-purple-950 flex items-center gap-2">
              <i className="fa-solid fa-boxes-packing text-blue-700"></i> Active Dispatch & Delivery Records ({assignedDeliveries.length})
            </h3>

            <div className="space-y-3">
              {assignedDeliveries.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-purple-200 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-purple-100 text-purple-950 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md">
                        {item.orderId}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        item.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">Assigned: {item.assignedAt}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{item.productName}</h4>
                      <p className="text-xs text-gray-600">
                        Buyer: <strong>{item.buyerName}</strong> ({item.buyerEmail}) | Address: <strong>{item.deliveryAddress}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-medium text-purple-900">
                      <span className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                        <i className="fa-solid fa-user-gear text-blue-700"></i>
                        Driver: <strong>{item.driverName}</strong> ({item.driverEmail})
                      </span>
                      <span className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                        <i className="fa-solid fa-clock text-amber-800"></i>
                        Expected: <strong>{item.expectedTime}</strong>
                      </span>
                    </div>

                    {item.status === 'Delivered' && (
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-medium space-y-0.5">
                        <p className="font-bold">✓ Delivered at: {item.deliveredAt} | Location: {item.deliveryPlace}</p>
                        <p className="italic text-emerald-800">Notes: "{item.deliveryNotes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* MODAL 4: ASSIGN DOOR DELIVERY DRIVER MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-purple-100 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-widest bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Admin Dispatch Control
                </span>
                <h3 className="font-serif-title text-xl font-bold text-gray-900 mt-1">
                  Assign Order to Door Delivery Partner
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignDriverSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Order #ID</label>
                  <input
                    type="text"
                    required
                    value={deliveryForm.orderId}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, orderId: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Product Item</label>
                  <input
                    type="text"
                    required
                    value={deliveryForm.productName}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, productName: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Buyer Name & Email</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={deliveryForm.buyerName}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, buyerName: e.target.value })}
                    placeholder="Buyer Name"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="email"
                    required
                    value={deliveryForm.buyerEmail}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, buyerEmail: e.target.value })}
                    placeholder="Buyer Email"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={deliveryForm.deliveryAddress}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryAddress: e.target.value })}
                  placeholder="Street Address, City, Zip Code"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Door Delivery Partner *</label>
                <select
                  value={deliveryForm.driverEmail}
                  onChange={(e) => {
                    const selUser = usersList.find(u => u.email === e.target.value);
                    setDeliveryForm({
                      ...deliveryForm,
                      driverEmail: e.target.value,
                      driverName: selUser ? selUser.name : 'Sam Delivery Driver'
                    });
                  }}
                  className="w-full p-3 bg-blue-50/60 border border-blue-300 rounded-xl text-xs font-bold text-blue-950 focus:outline-none"
                >
                  <option value="delivery@example.com">Sam Delivery Driver (delivery@example.com)</option>
                  <option value="david.delivery@example.com">David Delivery (david.delivery@example.com)</option>
                  <option value="alex.delivery@example.com">Alex Delivery Partner (alex.delivery@example.com)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Admin Expected Delivery Time Slot *</label>
                <input
                  type="text"
                  required
                  value={deliveryForm.expectedTime}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, expectedTime: e.target.value })}
                  placeholder="e.g. Today by 5:30 PM / Tomorrow 10:00 AM"
                  className="w-full p-3 bg-amber-50/60 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Assign Driver & Send Email Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE PRODUCT CONFIRMATION MODAL */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-red-100 animate-fadeIn text-center">
            <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            
            <div>
              <h3 className="font-serif-title font-bold text-xl text-gray-900">Delete Product?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete <strong className="text-gray-900">"{deleteProductTarget.name}"</strong>? This item will be permanently removed from the catalog.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteProductTarget(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
