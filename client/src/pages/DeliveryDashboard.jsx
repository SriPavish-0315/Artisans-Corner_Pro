import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DeliveryDashboard = () => {
  const { user, triggerEmailNotification } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active' or 'delivered'
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Delivery Log Update Form State
  const [deliveryLog, setDeliveryLog] = useState({
    deliveredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    deliveryPlace: 'Customer Handover (Front Door)',
    deliveryNotes: 'Package delivered in excellent condition. Handed directly to buyer.',
    recipientName: ''
  });

  useEffect(() => {
    loadDeliveries();
  }, [user]);

  const loadDeliveries = () => {
    const saved = localStorage.getItem('artisans_assigned_deliveries');
    const list = saved ? JSON.parse(saved) : [];

    // Filter deliveries assigned specifically to current logged-in delivery driver email
    if (user?.email) {
      const myDeliveries = list.filter(
        d => d.driverEmail && d.driverEmail.toLowerCase() === user.email.toLowerCase()
      );
      setDeliveries(myDeliveries);
    } else {
      setDeliveries([]);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleOpenCompleteModal = (deliveryItem) => {
    setSelectedDelivery(deliveryItem);
    setDeliveryLog({
      deliveredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      deliveryPlace: 'Customer Handover (Front Door)',
      deliveryNotes: `Successfully delivered to ${deliveryItem.buyerName}. Package intact.`,
      recipientName: deliveryItem.buyerName
    });
  };

  const handleConfirmDelivery = (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const savedAll = JSON.parse(localStorage.getItem('artisans_assigned_deliveries') || '[]');

    const updatedDeliveries = deliveries.map(item => {
      if (item.id === selectedDelivery.id) {
        return {
          ...item,
          status: 'Delivered',
          deliveredAt: deliveryLog.deliveredAt,
          deliveryPlace: deliveryLog.deliveryPlace,
          deliveryNotes: deliveryLog.deliveryNotes,
          recipientName: deliveryLog.recipientName || item.buyerName
        };
      }
      return item;
    });

    setDeliveries(updatedDeliveries);

    // Save in global localStorage store
    const updatedGlobal = savedAll.map(item => {
      if (item.id === selectedDelivery.id) {
        return {
          ...item,
          status: 'Delivered',
          deliveredAt: deliveryLog.deliveredAt,
          deliveryPlace: deliveryLog.deliveryPlace,
          deliveryNotes: deliveryLog.deliveryNotes,
          recipientName: deliveryLog.recipientName || item.buyerName
        };
      }
      return item;
    });
    localStorage.setItem('artisans_assigned_deliveries', JSON.stringify(updatedGlobal.length ? updatedGlobal : updatedDeliveries));

    // Send Email Notification Alert to Buyer!
    if (triggerEmailNotification) {
      triggerEmailNotification(
        selectedDelivery.buyerEmail,
        '📦 Order Delivery Confirmation Email',
        `Your order ${selectedDelivery.orderId} (${selectedDelivery.productName}) was DELIVERED at ${deliveryLog.deliveryPlace} on ${deliveryLog.deliveredAt}. Notes: ${deliveryLog.deliveryNotes}`,
        'delivered'
      );
    }

    showToast(`Order ${selectedDelivery.orderId} marked as DELIVERED! Email notification sent to ${selectedDelivery.buyerEmail}.`);
    setSelectedDelivery(null);
  };

  const activeCount = deliveries.filter(d => d.status !== 'Delivered').length;
  const completedCount = deliveries.filter(d => d.status === 'Delivered').length;

  const filteredDeliveries = deliveries.filter(d => {
    if (filter === 'active') return d.status !== 'Delivered';
    if (filter === 'delivered') return d.status === 'Delivered';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-700 flex items-center gap-3 animate-slideUp">
          <i className="fa-solid fa-circle-check text-green-400 text-lg"></i>
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Delivery Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-blue-800/40">
        <div>
          <span className="text-xs font-bold text-blue-300 uppercase tracking-widest bg-blue-900/80 px-3 py-1 rounded-full border border-blue-700">
            Door Delivery Logistics Console
          </span>
          <h1 className="font-serif-title text-3xl font-bold mt-2">
            Welcome, {user?.name || 'Delivery Partner'}!
          </h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Driver ID: <strong className="text-white font-mono">{user?.email || 'delivery@example.com'}</strong> | Active Deliveries: <strong>{activeCount}</strong> | Completed: <strong>{completedCount}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-900/80 px-4 py-2 rounded-2xl border border-blue-700 text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online & Ready for Dispatch
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Assigned Orders</span>
            <p className="text-2xl font-extrabold text-blue-950 mt-1">{deliveries.length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-2xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-clipboard-list"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Out for Delivery</span>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Delivered Successfully</span>
            <p className="text-2xl font-extrabold text-emerald-800 mt-1">{completedCount}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-bold text-gray-600">
        <button
          onClick={() => setFilter('active')}
          className={`pb-3 transition-colors border-b-2 ${filter === 'active' ? 'border-blue-800 text-blue-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-clock mr-1.5"></i> Active Deliveries ({activeCount})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`pb-3 transition-colors border-b-2 ${filter === 'delivered' ? 'border-blue-800 text-blue-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          <i className="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i> Delivered History ({completedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 transition-colors border-b-2 ${filter === 'all' ? 'border-blue-800 text-blue-950 font-extrabold' : 'border-transparent hover:text-gray-900'}`}
        >
          All Dispatch Records ({deliveries.length})
        </button>
      </div>

      {/* Deliveries Table / Cards */}
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
            <i className="fa-solid fa-truck-ramp-box text-4xl text-blue-300"></i>
            <h3 className="text-lg font-bold text-gray-800">No Assigned Deliveries Yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              You currently have 0 active packages. Delivery packages will only appear here when the Admin assigns an order near your delivery location.
            </p>
          </div>
        ) : (
          filteredDeliveries.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-blue-100 text-blue-900 text-xs font-mono font-bold px-3 py-1 rounded-full">
                    {item.orderId}
                  </span>
                  <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                    item.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    <i className={`fa-solid ${item.status === 'Delivered' ? 'fa-circle-check' : 'fa-truck-fast'} mr-1`}></i>
                    {item.status}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Assigned: {item.assignedAt}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900">{item.productName}</h3>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Customer: <strong className="text-gray-900">{item.buyerName}</strong> ({item.buyerPhone})
                  </p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-location-dot text-red-600"></i>
                    <span>{item.deliveryAddress}</span>
                  </p>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-xs flex items-center gap-2">
                  <i className="fa-solid fa-clock text-amber-800 text-sm"></i>
                  <span>Expected Delivery Time Slot: <strong className="text-amber-950 font-bold">{item.expectedTime}</strong></span>
                </div>

                {item.status === 'Delivered' && (
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs space-y-1 text-emerald-950">
                    <p className="font-bold flex items-center gap-1.5">
                      <i className="fa-solid fa-clipboard-check text-emerald-700"></i> Delivered at: {item.deliveredAt}
                    </p>
                    <p>Drop-Off Location: <strong>{item.deliveryPlace}</strong></p>
                    <p className="text-emerald-800 italic">Notes: "{item.deliveryNotes}"</p>
                  </div>
                )}
              </div>

              {item.status !== 'Delivered' && (
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => handleOpenCompleteModal(item)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-box-archive text-sm"></i> Mark as Delivered & Update Log
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Complete Delivery & Log Update Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-emerald-200 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Update Delivery Status
                </span>
                <h3 className="font-serif-title text-xl font-bold text-gray-900 mt-1">
                  Delivery Confirmation ({selectedDelivery.orderId})
                </h3>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Customer / Recipient Name</label>
                <input
                  type="text"
                  required
                  value={deliveryLog.recipientName}
                  onChange={(e) => setDeliveryLog({ ...deliveryLog, recipientName: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Actual Delivery Date & Time *</label>
                <input
                  type="text"
                  required
                  value={deliveryLog.deliveredAt}
                  onChange={(e) => setDeliveryLog({ ...deliveryLog, deliveredAt: e.target.value })}
                  placeholder="e.g. 2026-08-10 17:15"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Drop-Off Location / Place *</label>
                <input
                  type="text"
                  required
                  value={deliveryLog.deliveryPlace}
                  onChange={(e) => setDeliveryLog({ ...deliveryLog, deliveryPlace: e.target.value })}
                  placeholder="e.g. Front Door / Handed directly to buyer / Reception"
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Notes & Recipient Signature *</label>
                <textarea
                  rows="3"
                  required
                  value={deliveryLog.deliveryNotes}
                  onChange={(e) => setDeliveryLog({ ...deliveryLog, deliveryNotes: e.target.value })}
                  placeholder="e.g. Package delivered safely without damage. Received by customer."
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                ></textarea>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 font-semibold flex items-center gap-2">
                <i className="fa-solid fa-envelope-circle-check text-emerald-700 text-base"></i>
                <span>Submitting will automatically send a Delivery Confirmation Email to <strong className="underline">{selectedDelivery.buyerEmail}</strong></span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Confirm & Send Email Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeliveryDashboard;
