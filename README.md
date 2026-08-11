# 🎨 Artisan's Corner — Multi-Vendor Marketplace Platform

🌐 **Live Web Application**: [https://artisans-corner-web.vercel.app](https://artisans-corner-web.vercel.app)

**Artisan's Corner** is a full-stack, production-ready multi-vendor e-commerce platform built with React, Vite, Node.js, Express, MongoDB, Verified Stripe PaymentIntents, Cloudinary CDN Image Uploads, and Door Delivery Logistics Management.

---

## 🌟 Verified Stripe PaymentIntent Flow

```
  Cart
   ↓
  Checkout
   ↓
  Backend creates Stripe PaymentIntent (`POST /api/orders/create-payment-intent`)
   ↓
  Stripe Card Payment
   ↓
  Backend verifies Stripe Payment (`POST /api/orders/verify-stripe-payment`)
   ↓
  Order marked Paid & PaymentResult saved
   ↓
  Stock reduced in Database (`$inc: { stock: -qty }`)
   ↓
  5% platform commission recorded (`$inc: { platformCommissionPaid }`)
   ↓
  95% seller earnings recorded (`$inc: { totalEarnings }`)
   ↓
  Cart cleared (`clearCart()`)
```

---

## 🔐 Demo Credentials Summary

| Role | Email | Password | Special Access Code |
| :--- | :--- | :--- | :--- |
| **Demo Buyer** | `buyer@example.com` | `password123` | N/A |
| **Demo Vendor (Seller)** | `seller@example.com` | `password123` | Store: *Terra Cotta Studios* |
| **Demo Admin** | `admin@example.com` | `password123` | Security Passcode: **`shop_@`** |
| **Demo Door Delivery** | `delivery@example.com` | `password123` | Partner: *Sam Delivery Driver* |

---

## 🛠️ Tech Stack & Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (Local instance or MongoDB Atlas)

### Server Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Client Setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The application will be live at `http://localhost:3000/`.

---

## 📄 Audit Checklist Status
- **Real Stripe PaymentIntent**: ✅ Implemented (`stripe.paymentIntents.create`)
- **Stripe Payment Verification**: ✅ Implemented (`stripe.paymentIntents.retrieve`)
- **Order Marked Paid**: ✅ Implemented
- **Stock Reduced in Database**: ✅ Implemented (`Product.findByIdAndUpdate`)
- **5% Platform Commission**: ✅ Implemented (`0.05 * total`)
- **95% Seller Earnings**: ✅ Implemented (`0.95 * total`)
- **Cart Cleared**: ✅ Implemented (`clearCart()`)
- **Cloudinary Image Upload**: ✅ Implemented (`/api/upload`)
- **Admin Passcode Security**: ✅ Implemented (`shop_@`)
- **Database Schema ERD**: ✅ Documented in [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)