const express = require('express');
const router = express.Router();
const User = require('../_models/User');
const Video = require('../_models/Video');
const { protect } = require('../_middleware/auth');
const { generateImageUploadParams } = require('../_lib/cloudinary');

/**
 * GET /api/user/me
 * Protected. Returns current user profile.
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/user/profile
 * Protected. Update name, bio, profilePictureUrl.
 * Body: { name, bio, profilePictureUrl, profilePicturePublicId }
 */
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, bio, profilePictureUrl, profilePicturePublicId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (profilePictureUrl !== undefined) {
      user.profilePictureUrl = profilePictureUrl;
    }

    if (profilePicturePublicId !== undefined) {
      user.profilePicturePublicId = profilePicturePublicId;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/user/avatar-presign
 * Protected. Returns signed params for Cloudinary avatar upload.
 */
router.post('/avatar-presign', protect, async (req, res, next) => {
  try {
    const signedParams = generateImageUploadParams('deceptor/avatars');
    res.status(200).json({ success: true, uploadParams: signedParams });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
