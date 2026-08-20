const https = require('https');

// Backblaze B2 Configuration
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID || process.env.B2_KEY_ID || '0057f8e145a654f0000000002';
const B2_APP_KEY = process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY || 'K0050yvkHpBs+glUbQF1fX57J92h+rQ';
const B2_BUCKET_ID = process.env.B2_BUCKET_ID || 'e7ffc86e012415eaa605041f';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'deceptor';

// In-memory cache for B2 Auth Tokens
let authCache = {
  apiUrl: null,
  authorizationToken: null,
  downloadUrl: null,
  expiresAt: 0,
};

let downloadAuthCache = {
  authorizationToken: null,
  expiresAt: 0,
};

/**
 * Helper to make HTTPS requests to B2 API
 */
const b2Request = (hostname, path, method, headers, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: hostname.replace('https://', '').replace(/\/$/, ''),
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              const err = new Error(parsed.message || `B2 API Error: ${res.statusCode}`);
              err.status = res.statusCode;
              err.b2Code = parsed.code;
              reject(err);
            }
          } catch (e) {
            reject(new Error(`Failed to parse B2 response: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

/**
 * Authorize Account with Backblaze B2 (Caches token for 20 hours)
 */
const authorizeAccount = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && authCache.authorizationToken && authCache.expiresAt > now) {
    return authCache;
  }

  const authString = Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
  const res = await b2Request(
    'api.backblazeb2.com',
    '/b2api/v2/b2_authorize_account',
    'GET',
    {
      Authorization: `Basic ${authString}`,
    }
  );

  authCache = {
    apiUrl: res.apiUrl,
    authorizationToken: res.authorizationToken,
    downloadUrl: res.downloadUrl,
    accountId: res.accountId,
    bucketId: res.allowed?.bucketId || B2_BUCKET_ID,
    bucketName: res.allowed?.bucketName || B2_BUCKET_NAME,
    expiresAt: now + 20 * 60 * 60 * 1000, // 20 hours
  };

  return authCache;
};

/**
 * Get Direct Upload URL & Token for Browser Ingest
 */
const getUploadUrl = async () => {
  let auth = await authorizeAccount();
  try {
    const res = await b2Request(
      auth.apiUrl,
      '/b2api/v2/b2_get_upload_url',
      'POST',
      {
        Authorization: auth.authorizationToken,
        'Content-Type': 'application/json',
      },
      { bucketId: auth.bucketId }
    );

    return {
      uploadUrl: res.uploadUrl,
      authorizationToken: res.authorizationToken,
      bucketId: res.bucketId,
      downloadUrl: auth.downloadUrl,
      bucketName: auth.bucketName,
    };
  } catch (err) {
    if (err.status === 401 || err.b2Code === 'unauthorized' || err.b2Code === 'expired_auth_token') {
      auth = await authorizeAccount(true);
      const res = await b2Request(
        auth.apiUrl,
        '/b2api/v2/b2_get_upload_url',
        'POST',
        {
          Authorization: auth.authorizationToken,
          'Content-Type': 'application/json',
        },
        { bucketId: auth.bucketId }
      );
      return {
        uploadUrl: res.uploadUrl,
        authorizationToken: res.authorizationToken,
        bucketId: res.bucketId,
        downloadUrl: auth.downloadUrl,
        bucketName: auth.bucketName,
      };
    }
    throw err;
  }
};

/**
 * Get Download Authorization Token for streaming private bucket files
 */
const getDownloadAuthToken = async (validDurationSeconds = 604800) => {
  const now = Date.now();
  if (downloadAuthCache.authorizationToken && downloadAuthCache.expiresAt > now) {
    return downloadAuthCache.authorizationToken;
  }

  let auth = await authorizeAccount();
  try {
    const res = await b2Request(
      auth.apiUrl,
      '/b2api/v2/b2_get_download_authorization',
      'POST',
      {
        Authorization: auth.authorizationToken,
        'Content-Type': 'application/json',
      },
      {
        bucketId: auth.bucketId,
        fileNamePrefix: '',
        validDurationInSeconds: validDurationSeconds,
      }
    );

    downloadAuthCache = {
      authorizationToken: res.authorizationToken,
      expiresAt: now + (validDurationSeconds - 3600) * 1000,
    };

    return res.authorizationToken;
  } catch (err) {
    if (err.status === 401) {
      auth = await authorizeAccount(true);
      const res = await b2Request(
        auth.apiUrl,
        '/b2api/v2/b2_get_download_authorization',
        'POST',
        {
          Authorization: auth.authorizationToken,
          'Content-Type': 'application/json',
        },
        {
          bucketId: auth.bucketId,
          fileNamePrefix: '',
          validDurationInSeconds: validDurationSeconds,
        }
      );
      return res.authorizationToken;
    }
    throw err;
  }
};

/**
 * Build direct high-speed streaming URL for a Backblaze video
 */
const getStreamUrl = async (fileName) => {
  const auth = await authorizeAccount();
  const token = await getDownloadAuthToken();
  const encodedName = fileName
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `${auth.downloadUrl}/file/${auth.bucketName}/${encodedName}?Authorization=${token}`;
};

/**
 * Delete a file from Backblaze B2
 */
const deleteFile = async (fileId, fileName) => {
  if (!fileId || !fileName) return;
  const auth = await authorizeAccount();
  return b2Request(
    auth.apiUrl,
    '/b2api/v2/b2_delete_file_version',
    'POST',
    {
      Authorization: auth.authorizationToken,
      'Content-Type': 'application/json',
    },
    {
      fileId,
      fileName,
    }
  );
};

module.exports = {
  B2_BUCKET_NAME,
  B2_BUCKET_ID,
  authorizeAccount,
  getUploadUrl,
  getDownloadAuthToken,
  getStreamUrl,
  deleteFile,
};
