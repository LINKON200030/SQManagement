const express = require('express');
const router = express.Router();
const {
  renderGallery,
  unlockGallery,
  downloadPhoto,
  downloadAll,
  checkout,
} = require('../controllers/galleryPublicController');

// Public, token-gated routes. No admin data is reachable from here — controllers
// only return the subset of fields the visitor needs.
router.get('/:token', renderGallery);
router.post('/:token/unlock', express.urlencoded({ extended: false }), unlockGallery);
router.get('/:token/download/:photoId', downloadPhoto);
router.get('/:token/download-all', downloadAll);
router.post('/:token/checkout', express.json(), checkout);

module.exports = router;
