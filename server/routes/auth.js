const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../lib/mailer');
const { signToken } = require('../middleware/auth');

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const OTP_EXPIRY_MINUTES = 10;

const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
};

// ─── SIGNUP ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup/request-otp
 * Body: { name, email }
 */
router.post('/signup/request-otp', async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Delete any existing OTP and create new one while sending email in parallel
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Promise.all([
      OTP.deleteMany({ email: email.toLowerCase(), purpose: 'signup' }),
      OTP.create({
        email: email.toLowerCase(),
        code: otp,
        purpose: 'signup',
        expiresAt,
      }),
      sendOTPEmail({ to: email, otp, purpose: 'signup' }),
    ]);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/signup/verify-otp
 * Body: { email, code }
 */
router.post('/signup/verify-otp', async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'signup',
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/signup/set-password
 * Body: { name, email, password, confirmPassword }
 */
router.post('/signup/set-password', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    // Verify OTP was completed
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'signup',
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Email not verified. Please complete OTP verification first.' });
    }

    // Double-check user doesn't already exist
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Account already exists.' });
    }

    // Create user — password hashing handled by pre-save hook
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      hashedPassword: password,
      isVerified: true,
    });

    // Clean up OTP record
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'signup' });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password/request-otp
 * Body: { email }
 */
router.post('/forgot-password/request-otp', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Promise.all([
      OTP.deleteMany({ email: email.toLowerCase(), purpose: 'reset' }),
      OTP.create({
        email: email.toLowerCase(),
        code: otp,
        purpose: 'reset',
        expiresAt,
      }),
      sendOTPEmail({ to: email, otp, purpose: 'reset' }),
    ]);

    res.status(200).json({
      success: true,
      message: `Password reset OTP sent to ${email}.`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/forgot-password/verify-otp
 * Body: { email, code }
 */
router.post('/forgot-password/verify-otp', async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'reset',
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    res.status(200).json({ success: true, message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/forgot-password/reset
 * Body: { email, password, confirmPassword }
 */
router.post('/forgot-password/reset', async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'reset',
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not verified. Please complete verification first.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Update password — pre-save hook will re-hash
    user.hashedPassword = password;
    await user.save();

    // Clean up OTP
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'reset' });

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
