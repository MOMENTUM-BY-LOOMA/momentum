const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME || null;
const S3_BUCKET = process.env.S3_BUCKET || null;

function fileFilter(_req, file, cb) {
  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/ogg',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'text/plain',
    'application/zip',
    'application/octet-stream',
    'model/gltf-binary',
    'application/gltf+json',
    'model/obj',
    'model/fbx',
    'model/stl',
    'model/vnd.usdz+zip',
  ]);

  if (allowedMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }

  // Extension fallback for 3D models (browsers often send application/octet-stream)
  const ext = String(file.originalname || '').split('.').pop()?.toLowerCase() || '';
  if (['glb', 'gltf', 'obj', 'fbx', 'stl'].includes(ext)) {
    return cb(null, true);
  }

  return cb(new Error('Unsupported file type'));
}

let upload;
let useS3 = false;
let useCloudinary = false;
let cloudinaryInstance = null;

if (CLOUDINARY_NAME) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });
  cloudinaryInstance = cloudinary;

  upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
  });
  useCloudinary = true;
} else if (S3_BUCKET) {
  upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
  });
  useS3 = true;
} else {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniquePrefix}-${safeName}`);
    },
  });

  upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
}

module.exports = {
  upload,
  uploadsDir,
  useS3,
  S3_BUCKET,
  useCloudinary,
  cloudinaryInstance,
};
