const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Gallery = require('../models/Gallery');
const GalleryOrder = require('../models/GalleryOrder');
const { uniqueSlug } = require('../lib/slug');
const { putObject, deleteObject, galleryPhotoKey } = require('../lib/r2');
const { buildWebVariant, normalizeFullVariant } = require('../lib/galleryImage');

const buildShareLink = (token) => {
  const base = (process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');
  return base ? `${base}/g/${token}` : `/g/${token}`;
};

// Trim the noisy fields from admin responses (photo binaries live in R2, not here).
const adminGalleryView = (g) => {
  const obj = g.toObject ? g.toObject({ virtuals: true }) : g;
  return {
    _id: obj._id,
    clientName: obj.clientName,
    shootDate: obj.shootDate,
    slug: obj.slug,
    token: obj.token,
    hasPassword: Boolean(obj.passwordHash),
    expiresAt: obj.expiresAt,
    settings: obj.settings,
    photoCount: (obj.photos || []).length,
    highlightCount: (obj.photos || []).filter((p) => p.isHighlight).length,
    photos: (obj.photos || []).map((p) => ({
      _id: p._id,
      isHighlight: p.isHighlight,
      order: p.order,
      originalName: p.originalName,
      bytes: p.bytes,
    })),
    shareLink: buildShareLink(obj.token),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const createGallery = async (req, res) => {
  try {
    const { clientName, shootDate, password, expiresAt, settings } = req.body || {};
    if (!clientName || !String(clientName).trim()) {
      return res.status(400).json({ message: 'Client name is required' });
    }
    const date = shootDate ? new Date(shootDate) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Valid shoot date is required' });
    }

    const slug = await uniqueSlug(Gallery, `${clientName}-${date.toISOString().slice(0, 10)}`);
    const token = crypto.randomBytes(24).toString('hex');

    const doc = {
      clientName: String(clientName).trim(),
      shootDate: date,
      slug,
      token,
      settings: {
        downloadEnabled: settings?.downloadEnabled === true,
        // brief default: watermark on, downloads off
        watermarkEnabled: settings?.watermarkEnabled !== false,
      },
    };
    if (password && String(password).length >= 4) {
      doc.passwordHash = await bcrypt.hash(String(password), 10);
    }
    if (expiresAt) {
      const exp = new Date(expiresAt);
      if (!Number.isNaN(exp.getTime())) doc.expiresAt = exp;
    }

    const gallery = await Gallery.create(doc);
    res.status(201).json(adminGalleryView(gallery));
  } catch (err) {
    console.error('createGallery error:', err);
    res.status(400).json({ message: err.message });
  }
};

const listGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    res.json(galleries.map(adminGalleryView));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getGallery = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });
    res.json(adminGalleryView(g));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateGallery = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });

    const { clientName, shootDate, expiresAt, password, clearPassword, settings, highlights } = req.body || {};

    if (clientName !== undefined) g.clientName = String(clientName).trim();
    if (shootDate !== undefined) {
      const d = new Date(shootDate);
      if (!Number.isNaN(d.getTime())) g.shootDate = d;
    }
    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') g.expiresAt = null;
      else {
        const d = new Date(expiresAt);
        if (!Number.isNaN(d.getTime())) g.expiresAt = d;
      }
    }
    if (clearPassword) g.passwordHash = '';
    else if (password && String(password).length >= 4) {
      g.passwordHash = await bcrypt.hash(String(password), 10);
    }
    if (settings && typeof settings === 'object') {
      if (typeof settings.downloadEnabled === 'boolean') g.settings.downloadEnabled = settings.downloadEnabled;
      if (typeof settings.watermarkEnabled === 'boolean') g.settings.watermarkEnabled = settings.watermarkEnabled;
    }
    // highlights = { [photoId]: boolean } — partial patch.
    if (highlights && typeof highlights === 'object') {
      for (const photo of g.photos) {
        const id = String(photo._id);
        if (id in highlights) photo.isHighlight = Boolean(highlights[id]);
      }
    }

    await g.save();
    res.json(adminGalleryView(g));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteGallery = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });
    // Best-effort R2 cleanup — don't block delete on it.
    for (const p of g.photos) {
      await deleteObject(p.r2KeyWeb).catch(() => {});
      await deleteObject(p.r2KeyFull).catch(() => {});
    }
    await g.deleteOne();
    res.json({ message: 'Gallery deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadPhotos = async (req, res) => {
  const t0 = Date.now();
  const galleryId = req.params.id;
  const fileCount = req.files?.length || 0;
  console.log(`[gallery-upload] start gallery=${galleryId} files=${fileCount}`);

  try {
    const g = await Gallery.findById(galleryId);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });
    if (!fileCount) {
      return res.status(400).json({ message: 'No files uploaded (field name: "files")' });
    }

    const watermarkEnabled = g.settings?.watermarkEnabled !== false;
    const created = [];
    const failed = [];
    let order = g.photos.length;

    // Sequential, not parallel — sharp + multer memoryStorage can balloon RAM
    // fast (each large JPEG decodes to width*height*3 bytes uncompressed).
    // On Render free tier (512 MB) this is the safest cadence; if you upgrade
    // you can revisit and add a small concurrency cap.
    for (const [i, file] of req.files.entries()) {
      const label = `${i + 1}/${fileCount} ${file.originalname || '(no name)'}`;
      const fileStart = Date.now();

      if (!file.mimetype?.startsWith('image/')) {
        console.warn(`[gallery-upload] skip ${label} — not an image (${file.mimetype})`);
        failed.push({ name: file.originalname || '', reason: `not an image (${file.mimetype})` });
        continue;
      }

      try {
        const photoId = new mongoose.Types.ObjectId();
        const webKey = galleryPhotoKey({ galleryId: g._id, variant: 'web', photoId, ext: 'jpg' });
        const fullKey = galleryPhotoKey({ galleryId: g._id, variant: 'full', photoId, ext: 'jpg' });

        const webBuffer = await buildWebVariant(file.buffer, { watermarkEnabled });
        console.log(`[gallery-upload] ${label} sharp:web ok ${webBuffer.length}B`);
        const fullBuffer = await normalizeFullVariant(file.buffer);
        console.log(`[gallery-upload] ${label} sharp:full ok ${fullBuffer.length}B`);

        await putObject({ key: webKey, body: webBuffer, contentType: 'image/jpeg' });
        await putObject({ key: fullKey, body: fullBuffer, contentType: 'image/jpeg' });
        console.log(`[gallery-upload] ${label} r2 ok`);

        g.photos.push({
          _id: photoId,
          r2KeyWeb: webKey,
          r2KeyFull: fullKey,
          originalName: file.originalname || '',
          contentType: 'image/jpeg',
          bytes: fullBuffer.length,
          isHighlight: false,
          order: order++,
        });
        created.push({ _id: photoId, originalName: file.originalname || '', bytes: fullBuffer.length });
        console.log(`[gallery-upload] ${label} done in ${Date.now() - fileStart}ms`);
      } catch (err) {
        console.error(`[gallery-upload] ${label} FAILED:`, err && err.stack ? err.stack : err);
        failed.push({ name: file.originalname || '', reason: err?.message || String(err) });
        // Keep going — one bad file shouldn't kill the batch.
      }
    }

    if (created.length) await g.save();
    console.log(
      `[gallery-upload] done ok=${created.length} failed=${failed.length} totalMs=${Date.now() - t0}`
    );
    res.status(201).json({
      added: created.length,
      failedCount: failed.length,
      photos: created,
      errors: failed,
      gallery: adminGalleryView(g),
    });
  } catch (err) {
    console.error('[gallery-upload] handler error:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: err?.message || 'Upload failed' });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });
    const photo = g.photos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    await Promise.all([
      deleteObject(photo.r2KeyWeb).catch(() => {}),
      deleteObject(photo.r2KeyFull).catch(() => {}),
    ]);
    photo.deleteOne();
    await g.save();
    res.json({ message: 'Photo deleted', gallery: adminGalleryView(g) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listGalleryOrders = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });
    const orders = await GalleryOrder.find({ gallery: g._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createGallery,
  listGalleries,
  getGallery,
  updateGallery,
  deleteGallery,
  uploadPhotos,
  deletePhoto,
  listGalleryOrders,
};
