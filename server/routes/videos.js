const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const nanoid = (len = 10) => crypto.randomBytes(len).toString('base64url').slice(0, len);
const Video = require('../models/Video');
const { protect } = require('../middleware/auth');
const b2 = require('../lib/backblaze');

// Ensure thumbnails directory exists
const thumbDir = path.join(__dirname, '../../uploads/thumbnails');
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
}

// Multer fallback configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `video-${Date.now()}-${nanoid(8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only video files are supported.'));
    }
  },
});

// ─── 1. BACKBLAZE B2 DIRECT UPLOAD SIGNER ──────────────────────────────────

/**
 * GET /api/videos/sign-upload
 * Protected. Generates direct upload URL and token for Backblaze B2 (Supports up to 10GB / 3-hour videos).
 */
router.get('/sign-upload', protect, async (req, res) => {
  try {
    const uploadInfo = await b2.getUploadUrl();
    res.status(200).json({
      success: true,
      provider: 'backblaze',
      uploadUrl: uploadInfo.uploadUrl,
      authorizationToken: uploadInfo.authorizationToken,
      bucketId: uploadInfo.bucketId,
      downloadUrl: uploadInfo.downloadUrl,
      bucketName: uploadInfo.bucketName,
    });
  } catch (err) {
    console.error('B2 Sign Upload Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize cloud storage upload channel: ' + err.message,
    });
  }
});

/**
 * POST /api/videos/save-cloud
 * Protected. Saves video metadata after high-speed Backblaze B2 upload into MongoDB.
 */
router.post('/save-cloud', protect, async (req, res, next) => {
  try {
    const {
      fileId,
      fileName,
      secure_url,
      duration,
      width,
      height,
      bytes,
      original_filename,
      format,
      title,
      thumbnailDataUrl,
    } = req.body;

    if (!fileName && !secure_url && !fileId) {
      return res.status(400).json({
        success: false,
        message: 'Storage file identifier or URL is required.',
      });
    }

    const shortLinkId = nanoid(10);
    let streamUrl = secure_url || null;
    let thumbnailUrl = null;

    // Generate authorized high-speed streaming link from Backblaze B2
    if (fileName) {
      try {
        streamUrl = await b2.getStreamUrl(fileName);
      } catch (sErr) {
        console.warn('Could not generate initial B2 stream URL:', sErr.message);
      }
    }

    // Save thumbnail if client generated one
    if (thumbnailDataUrl && thumbnailDataUrl.startsWith('data:image')) {
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

    const video = await Video.create({
      userId: req.user._id,
      originalFilename: original_filename || 'video.mp4',
      title: title || original_filename?.replace(/\.[^/.]+$/, '') || 'Untitled Video',
      b2FileId: fileId || null,
      b2FileName: fileName || null,
      cloudinarySecureUrl: secure_url || null,
      cloudinaryUrl: secure_url || null,
      streamUrl: streamUrl || `/api/videos/stream/${shortLinkId}`,
      status: 'ready',
      durationSeconds: duration || 0,
      fileSizeBytes: bytes || 0,
      format: (format || original_filename?.split('.').pop() || 'mp4').toLowerCase(),
      width: width || 1920,
      height: height || 1080,
      shortLinkId,
      thumbnailUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Video hosted permanently with universal address.',
      video: {
        _id: video._id,
        shortLinkId: video.shortLinkId,
        title: video.title,
        originalFilename: video.originalFilename,
        streamUrl: video.streamUrl,
        thumbnailUrl: video.thumbnailUrl,
        durationSeconds: video.durationSeconds,
        fileSizeBytes: video.fileSizeBytes,
        createdAt: video.createdAt,
      },
      shareLink: `/v/${shortLinkId}`,
      directCloudUrl: streamUrl,
    });
  } catch (err) {
    next(err);
  }
});

// ─── 2. HTTP 206 RANGE STREAMING & CDN RESOLUTION ───────────────────────────

/**
 * GET /api/videos/stream/:shortId
 * Public. Direct high-speed streaming resolution for universal player and embed.
 */
router.get('/stream/:shortId', async (req, res, next) => {
  try {
    const video = await Video.findOne({ shortLinkId: req.params.shortId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video stream not found.' });
    }

    // 1. Backblaze B2 Direct High-Speed CDN Stream
    if (video.b2FileName) {
      try {
        const streamUrl = await b2.getStreamUrl(video.b2FileName);
        return res.redirect(streamUrl);
      } catch (b2Err) {
        console.error('B2 Stream Error:', b2Err.message);
      }
    }

    // 2. Cloudinary CDN Stream
    if (video.cloudinarySecureUrl) {
      return res.redirect(video.cloudinarySecureUrl);
    }

    // 3. Local file streaming fallback
    if (video.localFilePath && fs.existsSync(video.localFilePath)) {
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
        return fileStream.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        };

        res.writeHead(200, head);
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    return res.status(404).json({ success: false, message: 'Video file not accessible.' });
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

    let dynamicStreamUrl = video.streamUrl;
    if (video.b2FileName) {
      try {
        dynamicStreamUrl = await b2.getStreamUrl(video.b2FileName);
      } catch (err) {
        console.warn('Failed to dynamically sign stream URL:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      video: {
        _id: video._id,
        shortLinkId: video.shortLinkId,
        title: video.title || video.originalFilename,
        originalFilename: video.originalFilename,
        streamUrl: dynamicStreamUrl || `/api/videos/stream/${video.shortLinkId}`,
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
      streamUrl: `/api/videos/stream/${v.shortLinkId}`,
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

    // Delete from Backblaze B2 if exists
    if (video.b2FileId && video.b2FileName) {
      try {
        await b2.deleteFile(video.b2FileId, video.b2FileName);
      } catch (bErr) {
        console.warn('B2 delete warning:', bErr.message);
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
