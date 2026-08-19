const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Generate a signed upload preset for direct browser-to-Cloudinary upload.
 * This prevents the video from ever touching Vercel's serverless function payload limits.
 */
const generateSignedUploadParams = (folder = 'deceptor/videos') => {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    resource_type: 'video',
    // Allow up to 3 hours = 10800 seconds
    // Cloudinary free tier: 100MB; paid plans: unlimited
  };

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

  return {
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
    resource_type: 'video',
  };
};

/**
 * Generate a signed upload for profile pictures (image)
 */
const generateImageUploadParams = (folder = 'deceptor/avatars') => {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder, resource_type: 'image' };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

  return {
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
    resource_type: 'image',
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
  generateImageUploadParams,
  deleteResource,
  getVideoInfo,
  getThumbnailUrl,
};
