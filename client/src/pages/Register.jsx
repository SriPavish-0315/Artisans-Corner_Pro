import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);

  // OTP Verification State
  const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [onScreenOtp, setOnScreenOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { sendSignupOtp, verifySignupOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (role === 'admin' && adminPasscode !== 'shop_@') {
      setError('Invalid Admin Security Code! Admin passcode shop_@ is required.');
      return;
    }

    if (role === 'delivery' && adminPasscode !== 'delivery_@') {
      setError('Invalid Admin Delivery Passcode! You must enter the Admin Delivery Passcode (delivery_@) assigned by Admin to register a Door Delivery Partner account.');
      return;
    }

    setLoading(true);
    const res = await sendSignupOtp(name, email, password, role, adminPasscode);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      if (res.otp) setOnScreenOtp(res.otp);
      setStep(2);
    } else {
      setError(res.message);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    const res = await verifySignupOtp(email, otpCode);
    setLoading(false);

    if (res.success) {
      if (role === 'seller') {
        navigate('/become-seller');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'delivery') {
        navigate('/delivery/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message || 'Wrong OTP code! Please enter the correct code or click Resend OTP.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-800 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-gray-900">
            {step === 1 ? 'Create Account' : 'Verify Your Email OTP'}
          </h2>
          <p className="text-xs text-gray-500">
            {step === 1 ? 'Sign up and verify your email via 6-digit OTP code' : `Enter the 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
                  className="absolute right-3 text-gray-500 hover:text-amber-900 text-sm focus:outline-none transition-colors"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Account Role</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'buyer'
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-amber-50/50 text-gray-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <i className="fa-solid fa-bag-shopping"></i> Buyer
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'seller'
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-amber-50/50 text-gray-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <i className="fa-solid fa-store"></i> Seller (Vendor)
                </button>

                <button
                  type="button"
                  onClick={() => { setRole('admin'); setAdminPasscode('shop_@'); }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'admin'
                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                      : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <i className="fa-solid fa-user-shield"></i> Admin
                </button>

                <button
                  type="button"
                  onClick={() => setRole('delivery')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'delivery'
                      ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <i className="fa-solid fa-truck-fast"></i> Door Delivery
                </button>
              </div>
            </div>

            {role === 'admin' && (
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
                    className="absolute right-3 text-purple-700 hover:text-purple-950 text-sm focus:outline-none transition-colors font-bold"
                    title={showAdminPasscode ? 'Hide Passcode' : 'Show Passcode'}
                  >
                    <i className={`fa-solid ${showAdminPasscode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            )}

            {role === 'delivery' && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <i className="fa-solid fa-key text-blue-700"></i> Admin Delivery Passcode *
                  </label>
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                    Code: delivery_@
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showAdminPasscode ? 'text' : 'password'}
                    required
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Enter Admin Delivery Passcode (delivery_@)"
                    className="w-full p-3 pr-10 bg-white border border-blue-300 rounded-xl text-xs font-mono font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                    className="absolute right-3 text-blue-700 hover:text-blue-950 text-sm focus:outline-none transition-colors font-bold"
                    title={showAdminPasscode ? 'Hide Passcode' : 'Show Passcode'}
                  >
                    <i className={`fa-solid ${showAdminPasscode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-800 text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-amber-900 transition-all cursor-pointer"
            >
              {loading ? 'Sending OTP Code...' : 'Send Verification OTP to Email'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit Verification OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-center font-mono text-xl tracking-widest font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Resend OTP
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-900 transition-all cursor-pointer"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Complete Signup'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-800 pt-2"
            >
              ← Back to Registration Details
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500">
          Already have an account? <Link to="/login" className="font-bold text-amber-800 hover:underline">Log in</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
