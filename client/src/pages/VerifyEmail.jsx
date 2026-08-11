import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmailOTP, resendEmailOTP } = useAuth();

  const userEmail = location.state?.email || localStorage.getItem('pending_verify_email') || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('pending_verify_email', userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setErrorMsg('');

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newDigits = pastedData.split('');
      setDigits(newDigits);
      setErrorMsg('');
      inputRefs[5].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = digits.join('');

    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setVerifying(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await verifyEmailOTP(userEmail, fullOtp);
    setVerifying(false);

    if (res.success) {
      setVerifiedSuccess(true);
      setSuccessMsg('Email Verified ✓');
      localStorage.removeItem('pending_verify_email');
      setTimeout(() => {
        navigate('/');
      }, 1800);
    } else {
      setErrorMsg(res.message || 'Incorrect verification code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    const res = await resendEmailOTP(userEmail);

    if (res.success) {
      setSuccessMsg(res.message || 'A new verification OTP has been sent to your email.');
      setCooldown(60);
    } else {
      setErrorMsg(res.message || 'Failed to resend OTP. Please try again.');
    }
  };

  if (!userEmail) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Email Verification</h2>
        <p className="text-gray-500 text-sm">No email address specified for verification.</p>
        <Link to="/login" className="inline-block px-6 py-2.5 bg-amber-800 text-white font-bold text-xs rounded-xl shadow">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-xl space-y-6 text-center">
        
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold border border-amber-200">
          <i className="fa-solid fa-envelope-circle-check"></i>
        </div>

        <div className="space-y-1">
          <h2 className="font-serif-title text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-xs text-gray-500">We've sent a 6-digit verification code to:</p>
          <p className="text-sm font-bold text-amber-950 font-mono">{userEmail}</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200 text-left">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Individual Digit Inputs */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={verifying || verifiedSuccess}
                className="w-12 h-14 bg-amber-50/50 border border-amber-300 focus:border-amber-800 rounded-2xl text-center text-xl font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-800 transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={verifying || verifiedSuccess || digits.join('').length !== 6}
            className={`w-full py-4 text-white font-bold text-sm rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
              verifiedSuccess ? 'bg-emerald-700' : 'bg-amber-800 hover:bg-amber-900'
            }`}
          >
            {verifiedSuccess ? 'Email Verified ✓' : verifying ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="pt-4 border-t border-amber-100 space-y-2">
          <p className="text-xs text-gray-500">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || verifying || verifiedSuccess}
            className="text-xs font-extrabold text-amber-800 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
          >
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VerifyEmail;
