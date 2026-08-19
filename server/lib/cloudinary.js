const cloudinary = require('cloudinary').v2;

const CLOUD_NAME = 'dhudpc4eu';
const API_KEY = '525641692227637';
const API_SECRET = 'ryBMoe-ToH6Q7D6lekd2yKdSgLA';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || API_KEY,
  api_secret: (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.length === 27)
    ? process.env.CLOUDINARY_API_SECRET
    : API_SECRET,
  secure: true,
});

/**
 * Generate a signed upload preset for direct browser-to-Cloudinary upload.
 * This prevents the video from ever touching Vercel's serverless function payload limits.
 */
const generateSignedUploadParams = (folder = 'deceptor/videos') => {
  const timestamp = Math.round(Date.now() / 1000);
  const activeSecret = (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.length === 27)
    ? process.env.CLOUDINARY_API_SECRET
    : API_SECRET;

  const activeKey = process.env.CLOUDINARY_API_KEY || API_KEY;
  const activeCloud = process.env.CLOUDINARY_CLOUD_NAME || CLOUD_NAME;

  const params = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(params, activeSecret);

  return {
    timestamp,
    signature,
    api_key: activeKey,
    cloud_name: activeCloud,
    folder,
  };
};

/**
 * Delete a resource from Cloudinary
 */
const deleteResource = async (publicId, resourceType = 'video') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
    throw err;
  }
};

/**
 * Get video metadata from Cloudinary (duration, format, dimensions)
 */
const getVideoInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
      image_metadata: true,
    });
    return result;
  } catch (err) {
    console.error('Cloudinary resource info error:', err.message);
    throw err;
  }
};

/**
 * Generate a thumbnail URL for a video
 */
const getThumbnailUrl = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width: 640, height: 360, crop: 'fill' },
      { start_offset: '10%' },
      { quality: 'auto' },
    ],
  });
};

module.exports = {
  cloudinary,
  generateSignedUploadParams,
  deleteResource,
  getVideoInfo,
  getThumbnailUrl,
};
