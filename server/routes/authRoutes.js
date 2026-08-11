const express = require('express');
const router = express.Router();
const {
  sendSignupOtp,
  verifySignupOtpAndRegister,
  registerUser,
  loginUser,
  sendForgotPasswordOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
  getUserProfile,
  updateUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Signup with OTP verification
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtpAndRegister);
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Forgot Password with OTP verification
router.post('/forgot-password-otp', sendForgotPasswordOtp);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPasswordWithOtp);

// User Profile
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;