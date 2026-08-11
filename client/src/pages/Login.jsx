import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State (Direct Reset, No OTP)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const isAdminMode = selectedRole === 'admin' || email.toLowerCase().includes('admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isAdminMode && adminPasscode !== 'shop_@') {
      setError('Invalid Admin Security Code! Default admin passcode shop_@ is required.');
      return;
    }

    setLoading(true);

    const res = await login(email, password, adminPasscode);
    setLoading(false);

    if (res.success) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (storedUser.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message);
    }
  };

  // Direct Password Reset Handler (OTP Disabled)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match! Please check your input.');
      return;
    }

    setForgotLoading(true);
    const res = await resetPassword(forgotEmail, '', newPassword);
    setForgotLoading(false);

    if (res.success) {
      setForgotSuccess('Password updated successfully! You can now log in with your new password.');
      setEmail(forgotEmail);
      setPassword(newPassword);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess('');
      }, 2000);
    } else {
      setForgotError(res.message || 'Failed to reset password. Please check your email address.');
    }
  };

  const [registeredList, setRegisteredList] = useState(() => {
    const raw = JSON.parse(localStorage.getItem('artisans_registered_users') || '[]');
    return raw.filter(u => u && u.email && !u.email.toLowerCase().includes('example.com') && !u.email.toLowerCase().includes('artisans.com'));
  });

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-800 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
            <i className="fa-solid fa-shapes"></i>
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-xs text-gray-500">Sign in with your registered account credentials</p>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotEmail(email);
                  setNewPassword('');
                  setConfirmPassword('');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 pr-10 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 hover:text-amber-900 text-sm focus:outline-none transition-colors cursor-pointer"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {isAdminMode && (
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                  <i className="fa-solid fa-key text-purple-700"></i> Admin Security Passcode *
                </label>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                  Code: shop_@
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showAdminPasscode ? 'text' : 'password'}
                  required
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Enter default code (shop_@)"
                  className="w-full p-3 pr-10 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                  className="absolute right-3 text-purple-700 hover:text-purple-950 text-sm focus:outline-none transition-colors font-bold cursor-pointer"
                  title={showAdminPasscode ? 'Hide Passcode' : 'Show Passcode'}
                >
                  <i className={`fa-solid ${showAdminPasscode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="text-[10px] text-purple-700 font-semibold">
                Admin authentication required. Default code is <code className="bg-purple-200 px-1 py-0.5 rounded font-bold">shop_@</code>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-800 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-amber-900 transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Don't have an account? <Link to="/register" className="font-bold text-amber-800 hover:underline">Register here</Link>
        </p>

        {/* Registered Credentials Box */}
        <div className="pt-2 border-t border-amber-100">
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                <i className="fa-solid fa-address-card text-amber-800"></i> Registered Account Database
              </h4>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {registeredList.length} User(s)
              </span>
            </div>

            {registeredList.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {registeredList.map((u, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setEmail(u.email);
                      setPassword(u.password || '');
                      if (u.role === 'admin') setAdminPasscode('shop_@');
                      setSelectedRole(u.role);
                    }}
                    className="p-2.5 bg-white hover:bg-amber-100/70 rounded-xl border border-amber-200/60 flex items-center justify-between cursor-pointer transition-colors group shadow-2xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-amber-900 flex items-center gap-1.5">
                        {u.name}
                        <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-900' :
                          u.role === 'seller' ? 'bg-amber-100 text-amber-900' :
                          u.role === 'delivery' ? 'bg-blue-100 text-blue-900' :
                          'bg-emerald-100 text-emerald-900'
                        }`}>
                          {u.role}
                        </span>
                      </p>
                      <p className="text-[11px] font-mono text-gray-600">Email: {u.email}</p>
                      <p className="text-[10px] font-mono text-gray-400">Password: {u.password}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 group-hover:bg-amber-800 group-hover:text-white px-2 py-1 rounded-lg transition-colors">
                      Fill <i className="fa-solid fa-arrow-right text-[9px] ml-0.5"></i>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-amber-900/80 font-medium space-y-1">
                <p className="font-bold text-amber-950">No registered user accounts found in database yet.</p>
                <p className="text-[11px] text-amber-800">
                  Please click <Link to="/register" className="underline font-extrabold text-amber-900">Register here</Link> to create your account!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* DIRECT FORGOT PASSWORD RESET MODAL (NO OTP) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-amber-100 shadow-2xl space-y-5 relative animate-fadeIn">
            
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold border border-amber-200">
                <i className="fa-solid fa-key text-amber-800"></i>
              </div>
              <h3 className="font-serif-title text-xl font-bold text-gray-900">Reset Your Password</h3>
              <p className="text-xs text-gray-500">
                Enter your registered email ID and your new password to reset your account credentials directly.
              </p>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                {forgotSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Registered Email ID</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3.5 bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-emerald-900 transition-all cursor-pointer"
              >
                {forgotLoading ? 'Updating Password...' : 'Reset & Save New Password'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
