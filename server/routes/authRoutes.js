const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  verifyEmailOTP,
  resendEmailOTP,
  loginUser,
  sendForgotPasswordOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
  getUserProfile,
  updateUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Server-side rate limiter for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Limit each IP to 15 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Registration & Email Verification OTP
router.post('/register', otpLimiter, registerUser);
router.post('/verify-email-otp', otpLimiter, verifyEmailOTP);
router.post('/resend-email-otp', otpLimiter, resendEmailOTP);

// Login
router.post('/login', loginUser);

// Password Reset OTP
router.post('/forgot-password-otp', otpLimiter, sendForgotPasswordOtp);
router.post('/verify-reset-otp', otpLimiter, verifyResetOtp);
router.post('/reset-password', otpLimiter, resetPasswordWithOtp);

// User Profile
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;