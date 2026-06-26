const express = require('express');
const multer = require('multer');
const router = express.Router();

const { requireAdmin } = require('../lib/adminAuth');
const {
  createGallery,
  listGalleries,
  getGallery,
  updateGallery,
  deleteGallery,
  uploadPhotos,
  deletePhoto,
  listGalleryOrders,
} = require('../controllers/galleryAdminController');
const printProducts = require('../controllers/printProductController');

// Frontend uploads files in parallel as individual POSTs (1 file each), so
// peak per-request memory is bounded by one file's buffer + one sharp decode.
// 25 MB covers straight-out-of-camera JPEGs from pro bodies (Canon R5/Sony A7R)
// and the per-request memory at concurrency 3 stays well under Render's
// 512 MB. files: 5 is the soft cap — the frontend sends 1, but allow a small
// batch if someone POSTs the legacy endpoint directly.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});

router.use(requireAdmin);

// Galleries
router.post('/galleries', createGallery);
router.get('/galleries', listGalleries);
router.get('/galleries/:id', getGallery);
router.patch('/galleries/:id', updateGallery);
router.delete('/galleries/:id', deleteGallery);

// Photos — wrap multer so its limit errors (LIMIT_FILE_SIZE / LIMIT_FILE_COUNT)
// come back as a JSON 400 instead of an opaque 500 with no body.
router.post(
  '/galleries/:id/photos',
  (req, res, next) => {
    upload.array('files', 5)(req, res, (err) => {
      if (!err) return next();
      const code = err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' ? 413 : 400;
      console.warn('[gallery-upload] multer rejected:', err.code, err.message);
      res.status(code).json({ message: err.message, code: err.code });
    });
  },
  uploadPhotos
);
router.delete('/galleries/:id/photos/:photoId', deletePhoto);

// Diagnostics — quick check that sharp loads and can do an in-memory roundtrip.
// Useful when "upload hangs" to confirm the native libvips binary is actually
// loaded on the host (vs the request silently dying mid-decode).
router.get('/diagnostics', async (req, res) => {
  const out = { node: process.version, env: process.env.NODE_ENV || 'unknown' };
  try {
    const sharp = require('sharp');
    out.sharp = { version: sharp.versions?.sharp, vips: sharp.versions?.vips, formats: Object.keys(sharp.format || {}) };
    const buf = await sharp({ create: { width: 16, height: 16, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .jpeg()
      .toBuffer();
    out.sharpRoundtripBytes = buf.length;
  } catch (err) {
    out.sharpError = err.message;
  }
  try {
    const r2 = require('../lib/r2');
    out.r2Configured = Boolean(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID);
    out.r2Bucket = process.env.R2_BUCKET || null;
    if (typeof r2.galleryPhotoKey === 'function') out.r2Helpers = true;
  } catch (err) {
    out.r2Error = err.message;
  }
  res.json(out);
});

// Orders for a gallery
router.get('/galleries/:id/orders', listGalleryOrders);

// Print catalogue
router.get('/print-products', printProducts.list);
router.post('/print-products', printProducts.create);
router.patch('/print-products/:id', printProducts.update);
router.delete('/print-products/:id', printProducts.remove);

module.exports = router;
