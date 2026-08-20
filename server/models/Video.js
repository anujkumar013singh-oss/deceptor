const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    // Storage fields
    localFilePath: {
      type: String,
      default: null,
    },
    streamUrl: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    cloudinaryUrl: {
      type: String,
      default: null,
    },
    cloudinarySecureUrl: {
      type: String,
      default: null,
    },
    // Backblaze B2 fields
    b2FileId: {
      type: String,
      default: null,
    },
    b2FileName: {
      type: String,
      default: null,
    },
    // Processing status
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'ready',
    },
    // Video metadata
    durationSeconds: {
      type: Number,
      default: null,
    },
    fileSizeBytes: {
      type: Number,
      default: null,
    },
    format: {
      type: String,
      default: 'mp4',
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    // Permanent universal short link
    shortLinkId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    // Thumbnail
    thumbnailUrl: {
      type: String,
      default: null,
    },
    // View count & telemetry
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Video', videoSchema);
