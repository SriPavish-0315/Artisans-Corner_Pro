const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user directly (OTP Verification Cancelled/Disabled)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email address, and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role && ['buyer', 'seller', 'admin', 'delivery'].includes(role) ? role : 'buyer',
      isEmailVerified: true
    });

    const subject = "🎉 Welcome to Artisan's Corner! Registration Successful";
    const message = `Congratulations ${user.name}! Your Artisan's Corner ${user.role.toUpperCase()} account was created successfully.`;
    sendEmail({ email: cleanEmail, subject, message }).catch(err => console.error('Email error:', err.message));

    return res.status(201).json({
      success: true,
      message: `Account registered successfully! Welcome ${user.name}.`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id)
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

// @desc    Verify Email OTP (Optional route handler)
// @route   POST /api/auth/verify-email-otp
// @access  Public
const verifyEmailOTP = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'OTP Verification is disabled. Email is automatically verified.'
  });
};

// @desc    Resend Email OTP (Optional route handler)
// @route   POST /api/auth/resend-email-otp
// @access  Public
const resendEmailOTP = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'OTP Verification is disabled.'
  });
};

// @desc    Auth user & get token (Instant Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email address and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail }).populate('store');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    const subject = '🔐 Account Login Security Notification';
    const message = `Hello ${user.name}! You successfully logged in to your Artisan's Corner ${user.role.toUpperCase()} account on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}. If this was not you, please reset your password.`;

    sendEmail({ email: user.email, subject, message }).catch(err => console.error('Email error:', err.message));

    return res.json({
      success: true,
      message: `Login successful! Welcome back, ${user.name}.`,
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
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.'
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
        message: 'No registered account found with this email address.'
      });
    }

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const subject = `🔐 Password Reset Request - Your OTP Code`;
    const message = `Hello ${user.name}! Your 6-digit password reset OTP for Artisan's Corner is ${rawOtp}. Valid for 10 minutes.`;

    console.log('\n==================================================');
    console.log(`📧 [RESET PASSWORD EMAIL OTP SENT TO MAIL ID]: ${cleanEmail}`);
    console.log(`CRYPTOGRAPHIC OTP CODE: ${rawOtp}`);
    console.log('==================================================\n');

    sendEmail({ email: cleanEmail, subject, message }).catch(err => console.error('Email error:', err.message));

    return res.status(200).json({
      success: true,
      message: `Password reset OTP sent to ${cleanEmail}. Please check your email inbox.`,
      email: cleanEmail
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

    if (!user.resetOtp || !user.resetOtpExpires || new Date(user.resetOtpExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired! Please request a new OTP.'
      });
    }

    const hashedSubmit = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');

    if (user.resetOtp !== hashedSubmit) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP code! Please enter the correct 6-digit code or click Resend OTP.'
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
    const { email, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address. Please check your email or sign up.'
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
  registerUser,
  verifyEmailOTP,
  resendEmailOTP,
  loginUser,
  sendForgotPasswordOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
  getUserProfile,
  updateUserProfile
};