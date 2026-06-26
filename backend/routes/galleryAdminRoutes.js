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

// Frontend uploads files in parallel as individual POSTs (1 file each).
// No sharp in the pipeline anymore — the buffer goes straight to R2 — so the
// only memory consideration is the buffer itself. 40 MB covers straight-out-of-
// camera JPEGs from pro bodies (Canon R5 ~30 MB, Sony A7R ~25 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024, files: 5 },
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
router.patch('/print-products/:id', printProducts.update);
router.delete('/print-products/:id', printProducts.remove);

module.exports = router;
