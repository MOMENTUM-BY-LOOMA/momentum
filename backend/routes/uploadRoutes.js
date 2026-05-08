const express = require('express');
const path = require('path');
const auth = require('../middleware/authMiddleware');
const {
  upload, uploadsDir, useS3, S3_BUCKET, useCloudinary, cloudinaryInstance,
} = require('../config/upload');

const router = express.Router();
const DEFAULT_PRESIGN_EXPIRES = 900;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Optional AWS S3 support
let s3Client = null;
let Sharp = null;
if (useS3) {
  try {
    const {
      S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand,
    } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    s3Client = new S3Client({});
    router.locals = router.locals || {};
    router.locals.S3 = {
      PutObjectCommand, DeleteObjectCommand, GetObjectCommand, getSignedUrl,
    };
    Sharp = require('sharp');
  } catch (e) {
    s3Client = null;
  }
}

function extractModelFormat(fileName) {
  const ext = String(fileName || '').split('.').pop()?.toLowerCase() || '';
  return ['glb', 'gltf', 'obj', 'fbx', 'stl'].includes(ext) ? ext : '';
}

function mimeToType(mime, originalName = '') {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('model/') || mime.includes('gltf')) return '3d';
  if (extractModelFormat(originalName)) return '3d';
  return 'file';
}

function modelFormatToMime(format) {
  const normalized = String(format || '').toLowerCase();
  if (normalized === 'glb') return 'model/gltf-binary';
  if (normalized === 'gltf') return 'application/gltf+json';
  if (normalized === 'obj') return 'model/obj';
  if (normalized === 'fbx') return 'model/fbx';
  if (normalized === 'stl') return 'model/stl';
  return 'application/octet-stream';
}

function safeObjectName(name) {
  return String(name || '')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

function safeFolder(folder) {
  const raw = String(folder || '').trim();
  if (!raw) return '';

  return raw
    .split('/')
    .map((part) => safeObjectName(part))
    .filter(Boolean)
    .join('/');
}

function publicS3Url(bucket, key) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  if (AWS_REGION === 'us-east-1') {
    return `https://${bucket}.s3.amazonaws.com/${encodedKey}`;
  }

  return `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${encodedKey}`;
}

function buildModelThumbnailDataUrl(label = '3D') {
  const safeLabel = String(label || '3D').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 18) || '3D';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#17324d"/>
          <stop offset="100%" stop-color="#0f1d2d"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="12" fill="url(#g)"/>
      <rect x="16" y="16" width="68" height="68" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
      <text x="50" y="49" fill="#fff" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" font-weight="700">3D</text>
      <text x="50" y="66" fill="#fff" fill-opacity="0.78" font-family="Arial, sans-serif" font-size="8" text-anchor="middle">${safeLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Upload a buffer to Cloudinary via upload_stream
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryInstance.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

// Generate a presigned URL for direct S3 upload (PUT)
router.post('/media/presign-upload', auth, async (req, res) => {
  if (!useS3 || !s3Client || !S3_BUCKET) {
    return res.status(400).json({ message: 'S3 is not configured' });
  }

  const fileName = safeObjectName(req.body?.fileName || 'file');
  const mimeType = String(req.body?.mimeType || 'application/octet-stream').trim();
  const folder = safeFolder(req.body?.folder || 'uploads');

  if (!fileName) {
    return res.status(400).json({ message: 'fileName is required' });
  }

  const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const key = folder ? `${folder}/${uniquePrefix}-${fileName}` : `${uniquePrefix}-${fileName}`;
  const expiresIn = Math.min(
    Number.parseInt(process.env.S3_PRESIGN_EXPIRES || `${DEFAULT_PRESIGN_EXPIRES}`, 10) || DEFAULT_PRESIGN_EXPIRES,
    3600,
  );

  try {
    const { PutObjectCommand, getSignedUrl } = router.locals.S3;
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    res.json({
      key,
      uploadUrl,
      fileUrl: publicS3Url(S3_BUCKET, key),
      expiresIn,
    });
  } catch (error) {
    console.error('S3 presign upload error', error);
    res.status(500).json({ message: 'Could not generate upload URL' });
  }
});

// Generate a dedicated presigned URL for large 3D model uploads (PUT)
router.post('/media/model3d/presign-upload', auth, async (req, res) => {
  if (!useS3 || !s3Client || !S3_BUCKET) {
    return res.status(400).json({ message: 'S3 is not configured' });
  }

  const fileName = safeObjectName(req.body?.fileName || '');
  if (!fileName) {
    return res.status(400).json({ message: 'fileName is required' });
  }

  const modelFormat = String(req.body?.modelFormat || extractModelFormat(fileName)).toLowerCase();
  if (!['glb', 'gltf', 'obj', 'fbx', 'stl'].includes(modelFormat)) {
    return res.status(400).json({ message: 'modelFormat must be one of glb, gltf, obj, fbx, stl' });
  }

  const subfolder = safeFolder(req.body?.subfolder || '');
  const folder = subfolder ? `3d-models/${subfolder}` : '3d-models';
  const mimeType = modelFormatToMime(modelFormat);
  const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const key = `${folder}/${uniquePrefix}-${fileName}`;

  const expiresIn = Math.min(
    Number.parseInt(process.env.S3_PRESIGN_EXPIRES || `${DEFAULT_PRESIGN_EXPIRES}`, 10) || DEFAULT_PRESIGN_EXPIRES,
    3600,
  );

  try {
    const { PutObjectCommand, getSignedUrl } = router.locals.S3;
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return res.json({
      key,
      folder,
      uploadUrl,
      fileUrl: publicS3Url(S3_BUCKET, key),
      thumbnailUrl: buildModelThumbnailDataUrl(fileName),
      modelFormat,
      mimeType,
      expiresIn,
    });
  } catch (error) {
    console.error('S3 model3d presign upload error', error);
    return res.status(500).json({ message: 'Could not generate model3d upload URL' });
  }
});

// Generate a presigned URL for private S3 downloads (GET)
router.get('/media/presign-download', auth, async (req, res) => {
  if (!useS3 || !s3Client || !S3_BUCKET) {
    return res.status(400).json({ message: 'S3 is not configured' });
  }

  const key = String(req.query.key || '').trim();
  if (!key) {
    return res.status(400).json({ message: 'key is required' });
  }

  const expiresIn = Math.min(
    Number.parseInt(process.env.S3_PRESIGN_EXPIRES || `${DEFAULT_PRESIGN_EXPIRES}`, 10) || DEFAULT_PRESIGN_EXPIRES,
    3600,
  );

  try {
    const { GetObjectCommand, getSignedUrl } = router.locals.S3;
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    res.json({ key, downloadUrl, expiresIn });
  } catch (error) {
    console.error('S3 presign download error', error);
    res.status(500).json({ message: 'Could not generate download URL' });
  }
});

router.post('/media', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const mediaType = mimeToType(req.file.mimetype, req.file.originalname);
  const is3D = mediaType === '3d';
  const modelFormat = is3D ? extractModelFormat(req.file.originalname) : '';

  // 3D models always go to local disk — Cloudinary free tier caps at 10 MB
  if (is3D && req.file.buffer) {
    try {
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniquePrefix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
      const fileName = `${uniquePrefix}_${safeName}`;
      const filePath = path.join(uploadsDir, fileName);
      await require('fs/promises').writeFile(filePath, req.file.buffer);
      return res.status(201).json({
        fileUrl: `/uploads/${fileName}`,
        fileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        type: '3d',
        modelFormat,
        thumbnailUrl: buildModelThumbnailDataUrl(req.file.originalname),
      });
    } catch (err) {
      console.error('3D disk save error', err);
      return res.status(500).json({ message: 'Upload failed' });
    }
  }

  // Cloudinary upload (images, videos, audio — small files)
  if (useCloudinary && cloudinaryInstance && req.file.buffer) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        resource_type: 'auto',
        folder: 'media',
        use_filename: true,
        unique_filename: true,
      });

      let thumbnailUrl = null;
      if (mediaType === 'image' && result.public_id) {
        thumbnailUrl = cloudinaryInstance.url(result.public_id, {
          width: 400,
          height: 400,
          crop: 'fill',
          quality: 75,
          format: 'jpg',
          secure: true,
        });
      }

      return res.status(201).json({
        fileUrl: result.secure_url,
        fileName: result.public_id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        type: mediaType,
        modelFormat,
        thumbnailUrl,
      });
    } catch (err) {
      console.error('Cloudinary upload error', err);
      return res.status(500).json({ message: 'Upload failed' });
    }
  }

  // S3 upload
  if (useS3 && s3Client && req.file.buffer) {
    try {
      const originalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const key = `${uniquePrefix}-${originalName}`;

      const { PutObjectCommand } = router.locals.S3;

      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));

      let thumbUrl = null;
      if (req.file.mimetype.startsWith('image/') && Sharp) {
        const thumbBuffer = await Sharp(req.file.buffer).resize({ width: 400 }).jpeg({ quality: 75 }).toBuffer();
        const thumbKey = `${uniquePrefix}-thumb.jpg`;
        await s3Client.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: thumbKey,
          Body: thumbBuffer,
          ContentType: 'image/jpeg',
        }));
        thumbUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${thumbKey}`;
      }

      return res.status(201).json({
        fileUrl: `https://${S3_BUCKET}.s3.amazonaws.com/${key}`,
        fileName: key,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        type: mediaType,
        modelFormat,
        thumbnailUrl: is3D ? buildModelThumbnailDataUrl(req.file.originalname) : thumbUrl,
      });
    } catch (err) {
      console.error('S3 upload error', err);
      return res.status(500).json({ message: 'Upload failed' });
    }
  }

  // Disk storage fallback (no cloud configured)
  if (req.file.path || req.file.filename) {
    const fileName = req.file.filename || path.basename(req.file.path);
    return res.status(201).json({
      fileUrl: `/uploads/${fileName}`,
      fileName,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      type: mediaType,
      modelFormat,
      thumbnailUrl: is3D ? buildModelThumbnailDataUrl(req.file.originalname) : undefined,
    });
  }

  res.status(500).json({ message: 'Unsupported upload configuration' });
});

router.delete('/media/:fileName', auth, async (req, res) => {
  const safeName = path.basename(req.params.fileName);

  if (useCloudinary && cloudinaryInstance) {
    try {
      // Determine resource type from extension
      const ext = safeName.split('.').pop()?.toLowerCase() || '';
      const is3D = ['glb', 'gltf', 'obj', 'fbx', 'stl'].includes(ext);
      const resourceType = is3D ? 'raw' : 'image';
      await cloudinaryInstance.uploader.destroy(safeName, { resource_type: resourceType });
      return res.json({ message: 'File deleted' });
    } catch (error) {
      console.error('Cloudinary delete error', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (useS3 && s3Client) {
    try {
      const { DeleteObjectCommand } = router.locals.S3;
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: safeName }));
      return res.json({ message: 'File deleted' });
    } catch (error) {
      console.error('S3 delete error', error);
      if (error.name === 'NoSuchKey') return res.status(404).json({ message: 'File not found' });
      return res.status(500).json({ message: 'Server error' });
    }
  }

  const filePath = path.join(__dirname, '..', 'uploads', safeName);

  try {
    await require('fs/promises').unlink(filePath);
    res.json({ message: 'File deleted' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'File not found' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
