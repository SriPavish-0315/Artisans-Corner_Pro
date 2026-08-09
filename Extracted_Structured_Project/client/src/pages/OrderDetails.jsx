import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const STATUS_STEPS = ['Pending', 'Paid', 'Processing', 'Packed', 'Shipped', 'Delivered'];

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(`http://localhost:5000/api/orders/${id}`, config);
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      // Demo Fallback order
      setOrder({
        _id: id || 'ord_demo_8932',
        createdAt: new Date().toISOString(),
        orderStatus: 'Processing',
        isPaid: true,
        paidAt: new Date().toISOString(),
        shippingAddress: {
          street: '124 Artisan Way',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94107',
          country: 'United States'
        },
        orderItems: [
          {
            _id: 'i1',
            name: 'Hand-thrown Speckled Ceramic Coffee Mug',
            quantity: 2,
            price: 38,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
            store: { storeName: 'Terra Cotta Studios' }
          }
        ],
        itemsPrice: 76,
        platformFee: 3.80,
        sellerEarnings: 72.20,
        shippingPrice: 10,
        taxPrice: 6.08,
        totalPrice: 92.08
      });
    }
  };

  if (!order) return <div className="text-center py-20 font-bold text-gray-600">Loading Order Details...</div>;

  const currentStepIndex = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-amber-100 shadow-sm gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">Order Confirmation</span>
          <h1 className="font-serif-title text-2xl font-bold text-gray-900">Order #{order._id}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold bg-green-100 text-green-800 border border-green-200">
            Payment Status: {order.isPaid ? 'PAID via Stripe' : 'Unpaid'}
          </span>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
        <h3 className="font-serif-title font-bold text-lg text-gray-900">Order Delivery Lifecycle</h3>

        <div className="relative flex items-center justify-between pt-4">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-amber-700 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%` }}
          ></div>

          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx <= currentStepIndex;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-amber-800 text-white shadow-md scale-110'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {isDone ? <i className="fa-solid fa-check text-[10px]"></i> : idx + 1}
                </div>
                <span className={`text-[11px] font-bold mt-2 ${isDone ? 'text-amber-900' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Purchased Items List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
          <h3 className="font-serif-title font-bold text-lg text-gray-900 border-b pb-3">Itemized Order Summary</h3>
          <div className="space-y-4">
            {order.orderItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-amber-50" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price}</p>
                </div>
                <span className="font-extrabold text-sm text-gray-900">${item.quantity * item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial & Shipping Info */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-3 text-sm">
            <h3 className="font-serif-title font-bold text-lg text-gray-900 border-b pb-2">Shipping Address</h3>
            <p className="text-gray-700 font-semibold">{order.shippingAddress?.street}</p>
            <p className="text-gray-600 text-xs">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
            </p>
            <p className="text-gray-600 text-xs">{order.shippingAddress?.country}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-3 text-sm">
            <h3 className="font-serif-title font-bold text-lg text-gray-900 border-b pb-2">Price Breakdown</h3>
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-bold">${order.itemsPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${order.shippingPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${order.taxPrice?.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t text-xs bg-amber-50 p-2.5 rounded-xl space-y-1">
              <span className="font-bold text-amber-900">Stored Commission & Earnings:</span>
              <div className="flex justify-between text-gray-600">
                <span>Platform Commission (5%)</span>
                <span>${order.platformFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Seller Earnings (95%)</span>
                <span>${order.sellerEarnings?.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-between font-extrabold text-amber-900 text-base">
              <span>Grand Total</span>
              <span>${order.totalPrice?.toFixed(2)}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderDetails;
