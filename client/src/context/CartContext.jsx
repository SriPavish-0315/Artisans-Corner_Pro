import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('artisans_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('artisans_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + quantity, product.stock || 99);
        return prevItems.map(item =>
          item._id === product._id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prevItems, {
          _id: product._id,
          name: product.name,
          price: product.price,
          thumbnail: product.thumbnail || product.images?.[0],
          quantity: Math.min(quantity, product.stock || 99),
          stock: product.stock || 10,
          seller: product.seller?._id || product.seller,
          store: product.store
        }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item._id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCartItems(prev =>
      prev.map(item => {
        if (item._id === id) {
          const validQty = Math.min(quantity, item.stock || 99);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemsSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = itemsSubtotal * 0.05; // 5%
  const sellerEarnings = itemsSubtotal * 0.95; // 95%
  const shippingPrice = itemsSubtotal > 100 || itemsSubtotal === 0 ? 0 : 10;
  const taxPrice = itemsSubtotal * 0.08;
  const grandTotal = itemsSubtotal + shippingPrice + taxPrice;
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemsSubtotal,
      platformFee,
      sellerEarnings,
      shippingPrice,
      taxPrice,
      grandTotal,
      totalItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
