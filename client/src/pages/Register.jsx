import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(name, email, password, role);
    setLoading(false);

    if (res.success) {
      if (role === 'seller') {
        navigate('/become-seller');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-800 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-xs text-gray-500">Join Artisan's Corner as a Buyer or Craftsman</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Craftsman"
              className="w-full p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

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

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Select Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  role === 'buyer'
                    ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                    : 'bg-amber-50/50 text-gray-700 border-amber-200'
                }`}
              >
                <i className="fa-solid fa-bag-shopping mr-1.5"></i> Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  role === 'seller'
                    ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                    : 'bg-amber-50/50 text-gray-700 border-amber-200'
                }`}
              >
                <i className="fa-solid fa-store mr-1.5"></i> Seller (Vendor)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-800 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-amber-900 transition-all"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Already have an account? <Link to="/login" className="font-bold text-amber-800 hover:underline">Log in</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
