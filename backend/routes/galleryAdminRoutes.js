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

const upload = multer({
  storage: multer.memoryStorage(),
  // 30 MB per photo is generous but stops anyone DoS-ing memory.
  limits: { fileSize: 30 * 1024 * 1024, files: 50 },
});

router.use(requireAdmin);

// Galleries
router.post('/galleries', createGallery);
router.get('/galleries', listGalleries);
router.get('/galleries/:id', getGallery);
router.patch('/galleries/:id', updateGallery);
router.delete('/galleries/:id', deleteGallery);

// Photos
router.post('/galleries/:id/photos', upload.array('files', 50), uploadPhotos);
router.delete('/galleries/:id/photos/:photoId', deletePhoto);

// Orders for a gallery
router.get('/galleries/:id/orders', listGalleryOrders);

// Print catalogue
router.get('/print-products', printProducts.list);
router.post('/print-products', printProducts.create);
router.patch('/print-products/:id', printProducts.update);
router.delete('/print-products/:id', printProducts.remove);

module.exports = router;
