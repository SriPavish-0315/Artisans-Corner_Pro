import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const fillDemo = (role) => {
    if (role === 'buyer') {
      setEmail('buyer@example.com');
      setPassword('password123');
    } else if (role === 'seller') {
      setEmail('seller@example.com');
      setPassword('password123');
    } else if (role === 'admin') {
      setEmail('admin@example.com');
      setPassword('password123');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-800 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
            <i className="fa-solid fa-shapes"></i>
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-xs text-gray-500">Sign in to your Artisan's Corner account</p>
        </div>

        {/* Quick Demo Credentials Panel */}
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2 text-center">
          <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Quick Demo Auto-Fill</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => fillDemo('buyer')}
              className="px-2.5 py-1 bg-amber-200 text-amber-950 font-bold text-[10px] rounded-lg hover:bg-amber-300"
            >
              Demo Buyer
            </button>
            <button
              onClick={() => fillDemo('seller')}
              className="px-2.5 py-1 bg-amber-800 text-white font-bold text-[10px] rounded-lg hover:bg-amber-900"
            >
              Demo Seller
            </button>
            <button
              onClick={() => fillDemo('admin')}
              className="px-2.5 py-1 bg-purple-800 text-white font-bold text-[10px] rounded-lg hover:bg-purple-900"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-800 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-amber-900 transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Don't have an account? <Link to="/register" className="font-bold text-amber-800 hover:underline">Register here</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
