const express = require('express');
const multer = require('multer');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
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

// Frontend uploads files in parallel as individual POSTs (1 file each).
// Files are written to a temp file on disk and STREAMED to R2 — never held in
// RAM. memoryStorage kept 2-3 full-size photos in memory at once, which ran the
// Render free-tier instance (512 MB) out of memory and killed the upload batch
// after 2-3 pictures. 40 MB covers straight-out-of-camera JPEGs from pro bodies.
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => cb(null, `sqm-upload-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`),
  }),
  limits: { fileSize: 40 * 1024 * 1024, files: 5 },
});

// Always remove temp files, whatever happened to the request.
const cleanupTempFiles = (req) => {
  for (const f of req.files || []) {
    if (f.path) fs.promises.unlink(f.path).catch(() => {});
  }
};

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
    res.on('finish', () => cleanupTempFiles(req));
    res.on('close', () => cleanupTempFiles(req));
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

// Diagnostics — confirms R2 env vars are set on the host (the only thing that
// can stop an upload now that sharp is out of the pipeline).
router.get('/diagnostics', async (req, res) => {
  const out = { node: process.version, env: process.env.NODE_ENV || 'unknown' };
  try {
    out.r2Configured = Boolean(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID);
    out.r2Bucket = process.env.R2_BUCKET || null;
    out.r2PublicUrl = process.env.R2_PUBLIC_URL || null;
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
router.post('/print-products/seed-defaults', printProducts.seedDefaults);
router.patch('/print-products/:id', printProducts.update);
router.delete('/print-products/:id', printProducts.remove);

module.exports = router;
