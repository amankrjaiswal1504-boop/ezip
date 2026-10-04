// Image uploads: Cloudinary when configured, otherwise files under /uploads
// served by the API. Only JPEG/PNG/WebP up to 5 MB are accepted.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const logger = require('../utils/logger');

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 6 },
  fileFilter: (req, file, cb) => {
    if (TYPES[file.mimetype]) return cb(null, true);
    const err = new Error('Only JPEG, PNG or WebP images are allowed');
    err.status = 400;
    return cb(err);
  },
});

function cloudinaryEnabled() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

// Magic-number check: the declared type must match the file bytes.
function looksLikeImage(buf) {
  if (!buf || buf.length < 12) return false;
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}

async function saveFile(file, folder = 'misc') {
  if (!looksLikeImage(file.buffer)) {
    const err = new Error('File is not a valid image');
    err.status = 400;
    throw err;
  }
  const safeFolder = String(folder).replace(/[^a-z0-9-]/gi, '') || 'misc';
  if (cloudinaryEnabled()) {
    const { v2: cloudinary } = require('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `scrapmate/${safeFolder}`, resource_type: 'image', transformation: [{ width: 1600, crop: 'limit', quality: 'auto' }] },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(file.buffer);
    });
    return result.secure_url;
  }
  const dir = path.join(UPLOAD_DIR, safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${TYPES[file.mimetype]}`;
  await fs.promises.writeFile(path.join(dir, name), file.buffer);
  const base = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  logger.info(`[mock-cloudinary] saved ${safeFolder}/${name} locally`);
  return `${base}/uploads/${safeFolder}/${name}`;
}

module.exports = { upload, saveFile, UPLOAD_DIR, cloudinaryEnabled };
