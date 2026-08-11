const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// Helper to generate cryptographically secure 6-digit numeric OTP
const generateCryptoOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Helper to hash OTP string with SHA-256 before database storage
const hashOtpString = (otp) => {
  return crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
};

// Helper to build branded HTML email for OTP verification
const buildOtpEmailHtml = (userName, otp) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; border-radius: 20px; overflow: hidden; border: 1px solid #fef3c7; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="background-color: #78350f; padding: 28px; text-align: center;">
        <h1 style="color: #ffffff; font-family: Georgia, serif; margin: 0; font-size: 26px; font-weight: bold;">Artisan's Corner</h1>
        <p style="color: #fde68a; margin: 4px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Handmade Goods Marketplace</p>
      </div>
      <div style="padding: 32px 28px; background-color: #ffffff;">
        <h2 style="color: #451a03; margin-top: 0; font-size: 20px; font-weight: bold;">Verify Your Email</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Thank you for creating an account with Artisan's Corner.</p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Your email verification code is:</p>
        
        <div style="background-color: #fffbeb; border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #78350f;">${otp}</span>
        </div>
        
        <p style="color: #92400e; font-size: 13px; font-weight: 600; text-align: center; margin-top: 12px;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px; line-height: 1.5;">For your security, do not share this code with anyone.<br/>If you did not create this account, you can safely ignore this email.</p>
      </div>
      <div style="background-color: #fffbeb; padding: 20px; text-align: center; border-top: 1px solid #fef3c7;">
        <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">Regards,<br/><strong>Artisan's Corner Team</strong></p>
      </div>
    </div>
  `;
};

// @desc    Register a new user & Send Email Verification OTP
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered and verified. Please log in.'
      });
    }

    const rawOtp = generateCryptoOtp();
    const hashedOtp = hashOtpString(rawOtp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;

    if (existingUser && !existingUser.isEmailVerified) {
      // Update existing unverified account to prevent duplicate unverified users
      existingUser.name = name || existingUser.name;
      existingUser.password = password;
      existingUser.role = role && ['buyer', 'seller', 'admin', 'delivery'].includes(role) ? role : existingUser.role;
      existingUser.emailVerificationOTP = hashedOtp;
      existingUser.emailVerificationOTPExpires = otpExpiry;
      existingUser.emailVerificationAttempts = 0;
      existingUser.lastOTPSentAt = new Date();
      user = await existingUser.save();
    } else {
      // Create new unverified user document
      user = await User.create({
        name,
        email: cleanEmail,
        password,
        role: role && ['buyer', 'seller', 'admin', 'delivery'].includes(role) ? role : 'buyer',
        isEmailVerified: false,
        emailVerificationOTP: hashedOtp,
        emailVerificationOTPExpires: otpExpiry,
        emailVerificationAttempts: 0,
        lastOTPSentAt: new Date()
      });
    }

    const subject = "Artisan's Corner - Verify Your Email";
    const message = `Hello ${user.name}! Your 6-digit email verification code for Artisan's Corner is ${rawOtp}. Valid for 10 minutes.`;
    const html = buildOtpEmailHtml(user.name, rawOtp);

    console.log('\n==================================================');
    console.log(`📧 [SIGNUP EMAIL OTP SENT TO MAIL ID]: ${cleanEmail}`);
    console.log(`CRYPTOGRAPHIC OTP CODE: ${rawOtp}`);
    console.log('==================================================\n');

    const emailResult = await sendEmail({ email: cleanEmail, subject, message, html });

    if (!emailResult.success) {
      console.error('Email delivery error:', emailResult.error);
    }

    return res.status(200).json({
      success: true,
      requiresEmailVerification: true,
      message: `Registration initiated. A 6-digit verification OTP has been sent to ${cleanEmail}.`,
      email: cleanEmail
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

// @desc    Verify Email OTP & Activate User Account
// @route   POST /api/auth/verify-email-otp
// @access  Public
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and OTP code.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found for verification.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'This email is already verified. You can log in.'
      });
    }

    if (user.emailVerificationAttempts >= 5) {
      user.emailVerificationOTP = null;
      user.emailVerificationOTPExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. The OTP has been invalidated. Please request a new OTP.'
      });
    }

    if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires || new Date(user.emailVerificationOTPExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    const hashedSubmittedOtp = hashOtpString(cleanOtp);

    if (user.emailVerificationOTP !== hashedSubmittedOtp) {
      user.emailVerificationAttempts += 1;
      await user.save();

      const remainingAttempts = 5 - user.emailVerificationAttempts;

      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. You have ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // OTP Correct & Valid! Activate account & clean up OTP fields
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationOTPExpires = null;
    user.emailVerificationAttempts = 0;
    user.lastOTPSentAt = null;

    const activatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      data: {
        _id: activatedUser._id,
        name: activatedUser.name,
        email: activatedUser.email,
        role: activatedUser.role,
        token: generateToken(activatedUser._id)
      }
    });

  } catch (error) {
    console.error('Verify Email OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during OTP verification.'
    });
  }
};

// @desc    Resend Email Verification OTP
// @route   POST /api/auth/resend-email-otp
// @access  Public
const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'This email is already verified. Please log in.'
      });
    }

    // 60-Second Cooldown Enforcement
    if (user.lastOTPSentAt) {
      const timeElapsedSeconds = Math.floor((Date.now() - new Date(user.lastOTPSentAt).getTime()) / 1000);
      if (timeElapsedSeconds < 60) {
        const secondsRemaining = 60 - timeElapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining}s before requesting another OTP.`
        });
      }
    }

    const rawOtp = generateCryptoOtp();
    const hashedOtp = hashOtpString(rawOtp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = hashedOtp;
    user.emailVerificationOTPExpires = otpExpiry;
    user.emailVerificationAttempts = 0;
    user.lastOTPSentAt = new Date();

    await user.save();

    const subject = "Artisan's Corner - Resent Verification OTP Code";
    const message = `Hello ${user.name}! Your new 6-digit email verification code for Artisan's Corner is ${rawOtp}. Valid for 10 minutes.`;
    const html = buildOtpEmailHtml(user.name, rawOtp);

    console.log('\n==================================================');
    console.log(`📧 [RESENT EMAIL OTP TO MAIL ID]: ${cleanEmail}`);
    console.log(`NEW CRYPTOGRAPHIC OTP CODE: ${rawOtp}`);
    console.log('==================================================\n');

    await sendEmail({ email: cleanEmail, subject, message, html });

    return res.status(200).json({
      success: true,
      message: `A new verification OTP has been sent to ${cleanEmail}.`
    });

  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during OTP resend.'
    });
  }
};

// @desc    Auth user & get token (Protected against unverified logins)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail }).populate('store');

    if (user && (await user.matchPassword(password))) {
      // Block unverified logins & trigger OTP verification
      if (!user.isEmailVerified) {
        const rawOtp = generateCryptoOtp();
        user.emailVerificationOTP = hashOtpString(rawOtp);
        user.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.emailVerificationAttempts = 0;
        user.lastOTPSentAt = new Date();
        await user.save();

        const subject = "Artisan's Corner - Complete Your Email Verification";
        const message = `Hello ${user.name}! Please verify your email address to log in. Your 6-digit OTP is ${rawOtp}. Valid for 10 minutes.`;
        const html = buildOtpEmailHtml(user.name, rawOtp);

        sendEmail({ email: cleanEmail, subject, message, html }).catch(e => console.error(e));

        return res.status(401).json({
          success: false,
          requiresEmailVerification: true,
          email: cleanEmail,
          message: 'Please verify your email address before logging in. A new OTP code has been sent to your email.'
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
        message: 'No registered account found with this email address.'
      });
    }

    const rawOtp = generateCryptoOtp();
    user.resetOtp = hashOtpString(rawOtp);
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

    const hashedSubmit = hashOtpString(otp);

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
    const { email, otp, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    const hashedSubmit = hashOtpString(otp);

    if (!user.resetOtp || user.resetOtp !== hashedSubmit) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP code! Please verify your OTP again.'
      });
    }

    if (new Date(user.resetOtpExpires) < new Date()) {
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