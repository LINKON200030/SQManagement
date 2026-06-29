const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Gallery = require('../models/Gallery');
const GalleryOrder = require('../models/GalleryOrder');
const { generateSlug } = require('../lib/slug');
const {
  putObject,
  deleteObject,
  getSignedGetUrl,
  galleryPhotoKey,
} = require('../lib/r2');

// Admin signed URLs live longer (60 min) so a long editing session doesn't
// expire mid-scroll. Public links stay short (10 min) where it matters.
const ADMIN_URL_TTL = 3600;

const buildShareLink = (slug) => {
  const base = (process.env.PUBLIC_APP_URL || '').replace(/\/$/, '');
  return base ? `${base}/g/${slug}` : `/g/${slug}`;
};

// Trim the noisy fields from admin responses (photo binaries live in R2, not here).
// `withPreviews` adds a 10-min signed URL per photo for the admin thumbnail grid.
const adminGalleryView = async (g, { withPreviews = false } = {}) => {
  const obj = g.toObject ? g.toObject({ virtuals: true }) : g;
  const photos = await Promise.all(
    (obj.photos || []).map(async (p) => ({
      _id: p._id,
      isHighlight: p.isHighlight,
      order: p.order,
      originalName: p.originalName,
      bytes: p.bytes,
      previewUrl: withPreviews
        ? await getSignedGetUrl(p.r2KeyWeb, { expiresIn: ADMIN_URL_TTL }).catch(() => null)
        : undefined,
    }))
  );
  return {
    _id: obj._id,
    clientName: obj.clientName,
    shootDate: obj.shootDate,
    slug: obj.slug,
    token: obj.token,
    hasPassword: Boolean(obj.passwordHash),
    expiresAt: obj.expiresAt,
    coverPhotoId: obj.coverPhotoId || null,
    settings: obj.settings,
    photoCount: (obj.photos || []).length,
    highlightCount: (obj.photos || []).filter((p) => p.isHighlight).length,
    photos,
    shareLink: buildShareLink(obj.slug),
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

    const slug = generateSlug(`${clientName}-${date.toISOString().slice(0, 10)}`);
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
    res.status(201).json(await adminGalleryView(gallery, { withPreviews: true }));
  } catch (err) {
    console.error('createGallery error:', err);
    res.status(400).json({ message: err.message });
  }
};

const listGalleries = async (req, res) => {
  try {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    // No previews on the list view — it's a thumbnail dashboard, not the detail.
    // Saves N*K signed-URL generations on big accounts.
    const out = await Promise.all(galleries.map((g) => adminGalleryView(g)));
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getGallery = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });
    res.json(await adminGalleryView(g, { withPreviews: true }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateGallery = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });

    const {
      clientName,
      shootDate,
      expiresAt,
      password,
      clearPassword,
      settings,
      highlights,
      coverPhotoId,
    } = req.body || {};

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
    }
    // highlights = { [photoId]: boolean } — partial patch.
    if (highlights && typeof highlights === 'object') {
      for (const photo of g.photos) {
        const id = String(photo._id);
        if (id in highlights) photo.isHighlight = Boolean(highlights[id]);
      }
    }
    if (coverPhotoId !== undefined) {
      if (coverPhotoId === null || coverPhotoId === '') {
        g.coverPhotoId = null;
      } else if (g.photos.id(coverPhotoId)) {
        g.coverPhotoId = coverPhotoId;
      } else {
        return res.status(400).json({ message: 'coverPhotoId does not exist in this gallery' });
      }
    }

    await g.save();
    res.json(await adminGalleryView(g, { withPreviews: true }));
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
      const keys = new Set([p.r2KeyWeb, p.r2KeyFull].filter(Boolean));
      for (const k of keys) await deleteObject(k).catch(() => {});
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

    const created = [];
    const failed = [];
    let order = g.photos.length;

    // No sharp, no resize, no watermark — the file goes straight to R2 as the
    // user uploaded it. One PUT per photo; the same key serves both the admin
    // preview and the public download. r2KeyWeb and r2KeyFull point at the
    // same object (we keep both fields so old galleries' two-variant photos
    // still work without a migration).
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
        const ext = (path.extname(file.originalname || '').slice(1) || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const key = galleryPhotoKey({ galleryId: g._id, variant: 'original', photoId, ext });

        await putObject({ key, body: file.buffer, contentType: file.mimetype || 'image/jpeg' });
        console.log(`[gallery-upload] ${label} r2 ok ${file.buffer.length}B`);

        g.photos.push({
          _id: photoId,
          r2KeyWeb: key,
          r2KeyFull: key,
          originalName: file.originalname || '',
          contentType: file.mimetype || 'image/jpeg',
          bytes: file.buffer.length,
          isHighlight: false,
          order: order++,
        });
        created.push({ _id: photoId, originalName: file.originalname || '', bytes: file.buffer.length });
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
      gallery: await adminGalleryView(g, { withPreviews: true }),
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
    const keys = new Set([photo.r2KeyWeb, photo.r2KeyFull].filter(Boolean));
    await Promise.all([...keys].map((k) => deleteObject(k).catch(() => {})));
    photo.deleteOne();
    await g.save();
    res.json({ message: 'Photo deleted', gallery: await adminGalleryView(g, { withPreviews: true }) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listGalleryOrders = async (req, res) => {
  try {
    const g = await Gallery.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Gallery not found' });
    const orders = await GalleryOrder.find({ gallery: g._id }).sort({ createdAt: -1 }).lean();

    // Build a single map photoId -> r2Key so we sign each photo at most once
    // even if it appears across multiple orders.
    const photoMap = new Map(g.photos.map((p) => [String(p._id), p.r2KeyWeb]));
    // photoId -> original filename, for orders placed before we stored it.
    const nameMap = new Map(g.photos.map((p) => [String(p._id), p.originalName || '']));
    const urlCache = new Map();
    const signFor = async (photoId) => {
      const id = String(photoId);
      if (urlCache.has(id)) return urlCache.get(id);
      const key = photoMap.get(id);
      if (!key) {
        urlCache.set(id, null);
        return null;
      }
      const url = await getSignedGetUrl(key, { expiresIn: ADMIN_URL_TTL }).catch(() => null);
      urlCache.set(id, url);
      return url;
    };

    for (const order of orders) {
      for (const item of order.items) {
        if (item.photoId) {
          item.photoPreviewUrl = await signFor(item.photoId);
          if (!item.photoName) item.photoName = nameMap.get(String(item.photoId)) || null;
        }
      }
    }
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
