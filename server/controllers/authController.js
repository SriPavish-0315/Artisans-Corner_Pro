const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// Temporary in-memory store for pending signup OTPs (10-min TTL)
const pendingSignupOtps = new Map();

// Helper to generate 6-digit numeric OTP
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send Signup Verification OTP to Email
// @route   POST /api/auth/send-signup-otp
// @access  Public
const sendSignupOtp = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login instead.'
      });
    }

    const otp = generateOtpCode();
    const expires = Date.now() + 10 * 60 * 1000;

    pendingSignupOtps.set(cleanEmail, {
      name,
      email: cleanEmail,
      password,
      role: role && ['buyer', 'seller', 'admin', 'delivery'].includes(role) ? role : 'buyer',
      otp,
      expires
    });

    const subject = `🔑 Signup Email Verification OTP: ${otp}`;
    const message = `Hello ${name}! Your 6-digit email verification OTP for Artisan's Corner is ${otp}. Enter this code on the registration page to complete your signup. Valid for 10 minutes.`;

    sendEmail({ email: cleanEmail, subject, message }).catch(err => console.error('Email error:', err.message));

    return res.status(200).json({
      success: true,
      message: `Verification OTP sent to ${cleanEmail}. Please enter the code to complete registration.`,
      email: cleanEmail,
      otp // Included for on-screen notification display
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify Signup OTP and Register User
// @route   POST /api/auth/verify-signup-otp
// @access  Public
const verifySignupOtpAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const record = pendingSignupOtps.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No pending OTP found or OTP has expired. Please click Resend OTP.'
      });
    }

    if (record.expires < Date.now()) {
      pendingSignupOtps.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired! Please click Resend OTP to get a new code.'
      });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Wrong OTP code! Please enter the correct 6-digit code or click Resend OTP.'
      });
    }

    // OTP Verified! Create user in MongoDB
    const user = await User.create({
      name: record.name,
      email: record.email,
      password: record.password,
      role: record.role
    });

    pendingSignupOtps.delete(cleanEmail);

    if (user) {
      const subject = "🎉 Welcome to Artisan's Corner - Registration Successful";
      const message = `Hello ${user.name}! Your ${user.role.toUpperCase()} account was registered successfully. Welcome to our artisan marketplace!`;

      sendEmail({ email: user.email, subject, message }).catch(err => console.error('Email error:', err.message));

      res.status(201).json({
        success: true,
        message: `Account registered successfully as ${user.role.toUpperCase()}! Welcome email sent to ${user.email}.`,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register a new user (Direct fallback)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: role && ['buyer', 'seller', 'admin', 'delivery'].includes(role) ? role : 'buyer'
    });

    if (user) {
      const subject = "🎉 Welcome to Artisan's Corner - Registration Successful";
      const message = `Hello ${user.name}! Your ${user.role.toUpperCase()} account was registered successfully. Welcome to our artisan marketplace!`;

      sendEmail({ email: user.email, subject, message }).catch(err => console.error('Email error:', err.message));

      res.status(201).json({
        success: true,
        message: `User registered successfully! Confirmation email sent to ${user.email}.`,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail }).populate('store');

    if (user && (await user.matchPassword(password))) {
      const subject = '🔐 Account Login Security Notification';
      const message = `Hello ${user.name}! You successfully logged in to your Artisan's Corner ${user.role.toUpperCase()} account on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}. If this was not you, please reset your password.`;

      sendEmail({ email: user.email, subject, message }).catch(err => console.error('Email error:', err.message));

      res.json({
        success: true,
        message: `Login successful! Security notification sent to ${user.email}.`,
        emailSent: true,
        emailDetails: {
          to: user.email,
          subject,
          body: message
        },
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          store: user.store,
          avatar: user.avatar,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send Forgot Password OTP to Registered Email
// @route   POST /api/auth/forgot-password-otp
// @access  Public
const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address. Please check your email or sign up.'
      });
    }

    const otp = generateOtpCode();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const subject = `🔐 Password Reset Request - Your OTP is ${otp}`;
    const message = `Hello ${user.name}! Your 6-digit password reset OTP for Artisan's Corner is ${otp}. Use this code to reset your account password. Valid for 10 minutes.`;

    sendEmail({ email: cleanEmail, subject, message }).catch(err => console.error('Email error:', err.message));

    return res.status(200).json({
      success: true,
      message: `Password reset OTP sent to ${cleanEmail}. Please check your email inbox.`,
      email: cleanEmail,
      otp // Included for on-screen notification display
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify Password Reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    if (!user.resetOtp || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired! Please click Resend OTP to request a new code.'
      });
    }

    if (user.resetOtp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Wrong OTP code! Please enter the correct 6-digit code or click Resend OTP.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully! You can now enter your new password.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset Password using Verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    if (!user.resetOtp || user.resetOtp !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Wrong or invalid OTP code! Please verify your OTP again.'
      });
    }

    if (user.resetOtpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired! Please request a new OTP.'
      });
    }

    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    const subject = '🔒 Security Notification: Password Changed';
    const message = `Hello ${user.name}! Your Artisan's Corner account password was reset successfully on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}. You can now login with your new password.`;

    sendEmail({ email: user.email, subject, message }).catch(err => console.error('Email error:', err.message));

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('store');

    if (user) {
      res.json({
        success: true,
        message: 'User profile retrieved',
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar || user.avatar;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          token: generateToken(updatedUser._id)
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  sendSignupOtp,
  verifySignupOtpAndRegister,
  registerUser,
  loginUser,
  sendForgotPasswordOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
  getUserProfile,
  updateUserProfile
};