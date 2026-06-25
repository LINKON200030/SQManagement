const express = require('express');
const router = express.Router();
const {
  renderGallery,
  unlockGallery,
  downloadPhoto,
  downloadAll,
  checkout,
} = require('../controllers/galleryPublicController');

// Public, slug-gated routes. The slug embeds a 48-bit random suffix so it's
// unguessable AND human-readable (e.g. john-jane-2026-06-25-a1b2c3d4e5f6).
// Controllers only return the subset of fields the visitor needs — no admin
// data leaks through here.
router.get('/:slug', renderGallery);
router.post('/:slug/unlock', express.urlencoded({ extended: false }), unlockGallery);
router.get('/:slug/download/:photoId', downloadPhoto);
router.get('/:slug/download-all', downloadAll);
router.post('/:slug/checkout', express.json(), checkout);

module.exports = router;
