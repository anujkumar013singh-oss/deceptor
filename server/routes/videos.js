const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { nanoid } = require('nanoid');
const { protect } = require('../middleware/auth');
const Video = require('../models/Video');
const {
  cloudinary,
  getThumbnailUrl,
  deleteResource,
} = require('../lib/cloudinary');

// Ensure storage directories are serverless-safe (using os.tmpdir on Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isServerless ? path.join(os.tmpdir(), 'deceptor_videos') : path.join(__dirname, '..', 'uploads', 'videos');
const thumbDir = isServerless ? path.join(os.tmpdir(), 'deceptor_thumbs') : path.join(__dirname, '..', 'uploads', 'thumbnails');

try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
} catch (e) {
  console.warn('Storage directory initialization warning:', e.message);
}

// Configure Multer Disk Storage in serverless-safe directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const uniqueName = `${Date.now()}-${nanoid(8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB limit
  },
});

// ─── 1. DIRECT VIDEO UPLOAD WITH CLOUDINARY SYNC ───────────────────────────

/**
 * POST /api/videos/upload-direct
 * Protected. Uploads video file directly, syncs to Cloudinary worldwide CDN,
 * and generates both universal web link and direct res.cloudinary.com URL.
 */
router.post('/upload-direct', protect, upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided.' });
    }

    const { originalname, size, path: filePath, mimetype } = req.file;
    const clientDuration = parseFloat(req.body.duration) || null;
    const clientWidth = parseInt(req.body.width, 10) || null;
    const clientHeight = parseInt(req.body.height, 10) || null;
    const thumbnailDataUrl = req.body.thumbnailDataUrl || null;

    // Generate unique 10-char short link ID
    const shortLinkId = nanoid(10);

    let directCloudUrl = null;
    let cloudPublicId = null;
    let thumbnailUrl = null;
    let duration = clientDuration;
    let width = clientWidth;
    let height = clientHeight;

    // Attempt Cloudinary Direct Upload
    try {
      const cRes = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: 'deceptor/videos',
      });

      if (cRes?.secure_url) {
        directCloudUrl = cRes.secure_url;
        cloudPublicId = cRes.public_id;
        thumbnailUrl = getThumbnailUrl(cRes.public_id);
        if (cRes.duration) duration = cRes.duration;
        if (cRes.width) width = cRes.width;
        if (cRes.height) height = cRes.height;
      }
    } catch (cErr) {
      console.warn('Cloudinary upload warning, falling back to stream:', cErr.message);
    }

    // Save fallback client thumbnail if Cloudinary thumbnail wasn't created
    if (!thumbnailUrl && thumbnailDataUrl && thumbnailDataUrl.startsWith('data:image')) {
      try {
        const base64Data = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const thumbFilename = `${shortLinkId}-thumb.jpg`;
        const thumbPath = path.join(thumbDir, thumbFilename);
        fs.writeFileSync(thumbPath, Buffer.from(base64Data, 'base64'));
        thumbnailUrl = `/api/videos/thumb/${shortLinkId}`;
      } catch (tErr) {
        console.warn('Thumbnail save warning:', tErr.message);
      }
    }

    const streamUrl = directCloudUrl || `/api/videos/stream/${shortLinkId}`;

    // Create MongoDB Video Record
    const video = await Video.create({
      userId: req.user._id,
      originalFilename: originalname,
      title: req.body.title || path.parse(originalname).name,
      localFilePath: filePath,
      cloudinaryPublicId: cloudPublicId,
      cloudinarySecureUrl: directCloudUrl,
      cloudinaryUrl: directCloudUrl,
      streamUrl,
      status: 'ready',
      durationSeconds: duration,
      fileSizeBytes: size,
      format: (mimetype.split('/')[1] || 'mp4').toLowerCase(),
      width,
      height,
      shortLinkId,
      thumbnailUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Video hosted successfully with permanent universal link.',
      video: {
        _id: video._id,
        shortLinkId: video.shortLinkId,
        title: video.title,
        originalFilename: video.originalFilename,
        streamUrl: video.streamUrl,
        cloudinarySecureUrl: video.cloudinarySecureUrl,
        thumbnailUrl: video.thumbnailUrl,
        durationSeconds: video.durationSeconds,
        fileSizeBytes: video.fileSizeBytes,
        createdAt: video.createdAt,
      },
      shareLink: `/v/${shortLinkId}`,
      directCloudUrl: directCloudUrl || streamUrl,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 2. HTTP 206 RANGE STREAMING ENGINE ─────────────────────────────────────

/**
 * GET /api/videos/stream/:shortId
 * Public. High-performance byte-range streaming for seamless seek and autoplay.
 */
router.get('/stream/:shortId', async (req, res, next) => {
  try {
    const video = await Video.findOne({ shortLinkId: req.params.shortId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video stream not found.' });
    }

    // If video has Cloudinary CDN URL, redirect to Cloudinary CDN directly
    if (video.cloudinarySecureUrl) {
      return res.redirect(video.cloudinarySecureUrl);
    }

    if (!video.localFilePath || !fs.existsSync(video.localFilePath)) {
      return res.status(404).json({ success: false, message: 'Video file missing from storage.' });
    }

    const filePath = video.localFilePath;
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const mimeType = video.format === 'webm' ? 'video/webm' : 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({ 'Content-Range': `bytes */${fileSize}` });
        return res.end();
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };

      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
});

// ─── 3. SERVE THUMBNAIL ─────────────────────────────────────────────────────

/**
 * GET /api/videos/thumb/:shortId
 * Public. Serves stored thumbnail image.
 */
router.get('/thumb/:shortId', (req, res) => {
  const thumbPath = path.join(thumbDir, `${req.params.shortId}-thumb.jpg`);
  if (fs.existsSync(thumbPath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(thumbPath).pipe(res);
  }
  res.status(404).end();
});

// ─── 4. PUBLIC LINK RESOLUTION ──────────────────────────────────────────────

/**
 * GET /api/videos/public/:shortId
 * Public. Resolves universal link to playback metadata and increments telemetry.
 */
router.get('/public/:shortId', async (req, res, next) => {
  try {
    const video = await Video.findOne({ shortLinkId: req.params.shortId })
      .populate('userId', 'name profilePictureUrl')
      .exec();

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found or invalid link.' });
    }

    // Increment view count
    video.viewCount = (video.viewCount || 0) + 1;
    await video.save();

    const streamUrl = video.cloudinarySecureUrl || `/api/videos/stream/${video.shortLinkId}`;

    res.status(200).json({
      success: true,
      video: {
        _id: video._id,
        shortLinkId: video.shortLinkId,
        title: video.title || video.originalFilename,
        originalFilename: video.originalFilename,
        streamUrl,
        cloudinarySecureUrl: video.cloudinarySecureUrl,
        thumbnailUrl: video.thumbnailUrl,
        durationSeconds: video.durationSeconds,
        fileSizeBytes: video.fileSizeBytes,
        format: video.format,
        width: video.width,
        height: video.height,
        viewCount: video.viewCount,
        createdAt: video.createdAt,
        uploader: video.userId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 5. USER VIDEO HISTORY / DASHBOARD ──────────────────────────────────────

/**
 * GET /api/videos/my-history
 * Protected. Returns user's uploaded videos with stats.
 */
router.get('/my-history', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 24;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Video.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments({ userId: req.user._id }),
    ]);

    const formattedVideos = videos.map((v) => ({
      ...v,
      streamUrl: v.cloudinarySecureUrl || `/api/videos/stream/${v.shortLinkId}`,
    }));

    res.status(200).json({
      success: true,
      videos: formattedVideos,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 6. DELETE VIDEO ────────────────────────────────────────────────────────

/**
 * DELETE /api/videos/:id
 * Protected. Deletes video and removes storage file.
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, userId: req.user._id });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    // Delete from Cloudinary if exists
    if (video.cloudinaryPublicId) {
      try {
        await deleteResource(video.cloudinaryPublicId, 'video');
      } catch (cErr) {
        console.warn('Cloudinary delete warning:', cErr.message);
      }
    }

    // Delete local file if present
    if (video.localFilePath && fs.existsSync(video.localFilePath)) {
      try {
        fs.unlinkSync(video.localFilePath);
      } catch (fErr) {
        console.warn('File delete warning:', fErr.message);
      }
    }

    await Video.deleteOne({ _id: video._id });

    res.status(200).json({ success: true, message: 'Video deleted permanently.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
