import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadStripe } from '@stripe/stripe-js';
import App from './App';
import './index.css';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51U35zFGwXR2mjixCTI9LW44zSJEROh150zGeUijhZGPTSrV9N1JlEbH3exij4U3nfAlkUXYm7lhCazqBeEbIgeJO00KqcadZvV'
);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);