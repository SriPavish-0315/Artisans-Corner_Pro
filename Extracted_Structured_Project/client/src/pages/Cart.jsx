import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    itemsSubtotal,
    platformFee,
    sellerEarnings,
    shippingPrice,
    taxPrice,
    grandTotal
  } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-3xl">
          <i className="fa-solid fa-basket-shopping"></i>
        </div>
        <h2 className="font-serif-title text-3xl font-bold text-gray-900">Your Cart is Currently Empty</h2>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Explore our artisan marketplace and discover unique handcrafted ceramics, jewelry, woodwork, and fine textiles.
        </p>
        <Link
          to="/products"
          className="inline-block px-8 py-3.5 bg-amber-800 text-white font-bold text-sm rounded-2xl hover:bg-amber-900 transition-all shadow-md"
        >
          Browse Artisan Catalog →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif-title text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-xs text-gray-500 mt-1">Review items in your cart and order breakdown</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
            >
              <img
                src={item.thumbnail}
                alt={item.name}
                className="w-24 h-24 rounded-xl object-cover border border-amber-100 bg-amber-50"
              />

              <div className="flex-1 space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                  <i className="fa-solid fa-store mr-1"></i>{item.store?.storeName || 'Artisan Store'}
                </span>
                <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                <p className="text-xs text-gray-400">Unit Price: ${item.price}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-amber-200 rounded-xl bg-amber-50/50">
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    className="px-3 py-1 font-bold text-gray-700 hover:bg-amber-100 rounded-l-xl"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="px-3 py-1 font-bold text-gray-700 hover:bg-amber-100 rounded-r-xl"
                  >
                    +
                  </button>
                </div>

                <span className="font-extrabold text-base text-gray-900 w-16 text-right">
                  ${item.price * item.quantity}
                </span>

                <button
                  onClick={() => removeFromCart(item._id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove item"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Commission Transparency Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-md space-y-5">
            <h3 className="font-serif-title font-bold text-xl text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">${itemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span>{shippingPrice === 0 ? <strong className="text-green-700">FREE</strong> : `$${shippingPrice}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span>${taxPrice.toFixed(2)}</span>
              </div>

              {/* Marketplace Transparency Note */}
              <div className="pt-3 border-t border-dashed border-amber-200 text-xs bg-amber-50/80 p-3 rounded-xl space-y-1">
                <p className="font-bold text-amber-900">Fair Platform Commission Breakdown:</p>
                <div className="flex justify-between text-gray-600">
                  <span>Seller Net Earnings (95%)</span>
                  <span className="font-semibold text-gray-800">${sellerEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Artisan's Corner Fee (5%)</span>
                  <span className="font-semibold text-gray-800">${platformFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-base text-gray-900">Grand Total</span>
                <span className="font-extrabold text-2xl text-amber-900">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm rounded-2xl shadow-lg transition-all text-center block"
            >
              Proceed to Stripe Checkout →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
