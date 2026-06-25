const bcrypt = require('bcryptjs');
const archiver = require('archiver');
const Gallery = require('../models/Gallery');
const PrintProduct = require('../models/PrintProduct');
const GalleryOrder = require('../models/GalleryOrder');
const { getSignedGetUrl, getObjectStream } = require('../lib/r2');
const { issueCookie, hasValidCookie } = require('../lib/galleryAuth');
const { stripe } = require('../lib/stripe');
const {
  renderPasswordPage,
  renderGalleryPage,
  renderMessagePage,
} = require('../lib/galleryHtml');

const SIGNED_URL_TTL = 600; // 10 minutes
const CURRENCY = (process.env.STRIPE_CURRENCY || 'gbp').toLowerCase();

// All public responses: no caching, no robots.
const setPublicHeaders = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('X-Robots-Tag', 'noindex, nofollow');
};

const isExpired = (g) => g.expiresAt && g.expiresAt.getTime() < Date.now();

const loadGalleryByToken = async (token) => {
  if (!token || token.length < 24) return null;
  return Gallery.findOne({ token });
};

const renderGallery = async (req, res) => {
  setPublicHeaders(res);
  res.set('Content-Type', 'text/html; charset=utf-8');

  const gallery = await loadGalleryByToken(req.params.token);
  if (!gallery) return res.status(404).send(renderMessagePage({ title: 'Not found', message: 'This gallery link is invalid.' }));
  if (isExpired(gallery)) {
    return res.status(410).send(renderMessagePage({ title: 'Expired', message: 'This gallery link has expired. Please contact the studio.' }));
  }
  if (gallery.passwordHash && !hasValidCookie(req, gallery._id)) {
    return res.status(200).send(renderPasswordPage({ token: gallery.token }));
  }

  // Generate signed URLs for web variants only. Never expose r2KeyFull keys here.
  const photos = await Promise.all(
    gallery.photos
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(async (p) => ({
        _id: String(p._id),
        url: await getSignedGetUrl(p.r2KeyWeb, { expiresIn: SIGNED_URL_TTL }),
        isHighlight: Boolean(p.isHighlight),
      }))
  );

  const products = await PrintProduct.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const safeProducts = products.map((p) => ({
    sku: p.sku,
    name: p.name,
    description: p.description,
    priceMinor: p.priceMinor,
    currency: p.currency,
  }));

  res.send(
    renderGalleryPage({
      gallery: { token: gallery.token, clientName: gallery.clientName, shootDate: gallery.shootDate },
      photos,
      downloadEnabled: Boolean(gallery.settings?.downloadEnabled),
      watermarkOverlay: gallery.settings?.watermarkEnabled !== false,
      products: safeProducts,
      currency: CURRENCY,
    })
  );
};

const unlockGallery = async (req, res) => {
  setPublicHeaders(res);
  res.set('Content-Type', 'text/html; charset=utf-8');

  const gallery = await loadGalleryByToken(req.params.token);
  if (!gallery) return res.status(404).send(renderMessagePage({ title: 'Not found', message: 'This gallery link is invalid.' }));
  if (isExpired(gallery)) {
    return res.status(410).send(renderMessagePage({ title: 'Expired', message: 'This gallery link has expired.' }));
  }
  if (!gallery.passwordHash) return res.redirect(`/g/${gallery.token}`);

  const submitted = String(req.body?.password || '');
  const ok = submitted && (await bcrypt.compare(submitted, gallery.passwordHash));
  if (!ok) {
    return res.status(401).send(renderPasswordPage({ token: gallery.token, error: 'Wrong password — please try again.' }));
  }
  issueCookie(res, gallery._id);
  res.redirect(`/g/${gallery.token}`);
};

const requireUnlocked = async (req, res) => {
  const gallery = await loadGalleryByToken(req.params.token);
  if (!gallery) {
    res.status(404).json({ message: 'Not found' });
    return null;
  }
  if (isExpired(gallery)) {
    res.status(410).json({ message: 'Gallery expired' });
    return null;
  }
  if (gallery.passwordHash && !hasValidCookie(req, gallery._id)) {
    res.status(401).json({ message: 'Password required' });
    return null;
  }
  return gallery;
};

const downloadPhoto = async (req, res) => {
  setPublicHeaders(res);
  const gallery = await requireUnlocked(req, res);
  if (!gallery) return;
  if (!gallery.settings?.downloadEnabled) {
    return res.status(403).json({ message: 'Downloads are disabled for this gallery' });
  }
  const photo = gallery.photos.id(req.params.photoId);
  if (!photo) return res.status(404).json({ message: 'Photo not found' });

  const filename = (photo.originalName || `photo-${photo._id}.jpg`).replace(/[^\w.\-]/g, '_');
  // Redirect to a fresh signed URL with Content-Disposition baked in.
  const url = await getSignedGetUrl(photo.r2KeyFull, { expiresIn: SIGNED_URL_TTL, downloadFilename: filename });
  res.redirect(302, url);
};

const downloadAll = async (req, res) => {
  setPublicHeaders(res);
  const gallery = await requireUnlocked(req, res);
  if (!gallery) return;
  if (!gallery.settings?.downloadEnabled) {
    return res.status(403).json({ message: 'Downloads are disabled for this gallery' });
  }
  if (!gallery.photos.length) return res.status(404).json({ message: 'No photos to download' });

  const zipName = `${gallery.slug || 'gallery'}-full.zip`;
  res.set('Content-Type', 'application/zip');
  res.set('Content-Disposition', `attachment; filename="${zipName}"`);

  const archive = archiver('zip', { zlib: { level: 0 } }); // store mode — JPEGs don't compress
  archive.on('error', (err) => {
    console.error('zip error:', err);
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  archive.pipe(res);
  for (const [i, photo] of gallery.photos.entries()) {
    const stream = await getObjectStream(photo.r2KeyFull);
    const name = (photo.originalName || `photo-${String(i + 1).padStart(3, '0')}.jpg`).replace(/[^\w.\-]/g, '_');
    archive.append(stream, { name });
  }
  await archive.finalize();
};

const checkout = async (req, res) => {
  setPublicHeaders(res);
  if (!stripe) return res.status(503).json({ message: 'Stripe is not configured' });

  const gallery = await requireUnlocked(req, res);
  if (!gallery) return;

  const { email, items, fulfillment } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'A valid email is required' });
  }
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'No items in order' });
  }

  // Look up every SKU server-side. Client-supplied price is IGNORED.
  const skus = [...new Set(items.map((i) => String(i?.sku || '')).filter(Boolean))];
  if (!skus.length) return res.status(400).json({ message: 'Invalid items' });
  const products = await PrintProduct.find({ sku: { $in: skus }, active: true });
  const bySku = new Map(products.map((p) => [p.sku, p]));

  const lineItems = [];
  const orderItems = [];
  let subtotalMinor = 0;

  for (const item of items) {
    const p = bySku.get(String(item.sku));
    if (!p) return res.status(400).json({ message: `Unknown product: ${item.sku}` });
    const qty = Math.max(1, Math.min(50, parseInt(item.quantity, 10) || 1));

    let photoId = null;
    if (item.photoId) {
      const photo = gallery.photos.id(item.photoId);
      if (!photo) return res.status(400).json({ message: 'Photo not in this gallery' });
      photoId = photo._id;
    }

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: p.currency || CURRENCY,
        unit_amount: p.priceMinor,
        product_data: {
          name: p.name + (photoId ? ` (photo ${String(photoId).slice(-6)})` : ''),
          description: p.description || undefined,
        },
      },
    });
    orderItems.push({
      productSku: p.sku,
      productName: p.name,
      photoId,
      quantity: qty,
      unitPriceMinor: p.priceMinor,
      kind: p.kind,
    });
    subtotalMinor += p.priceMinor * qty;
  }

  const baseUrl = (process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: lineItems,
    // Free collection + paid delivery. Tweak delivery_minor via env.
    shipping_address_collection: { allowed_countries: ['GB'] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: CURRENCY },
          display_name: 'Collection from studio',
          delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 7 } },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: Number(process.env.GALLERY_DELIVERY_MINOR || 500), currency: CURRENCY },
          display_name: 'UK delivery',
          delivery_estimate: { minimum: { unit: 'business_day', value: 5 }, maximum: { unit: 'business_day', value: 10 } },
        },
      },
    ],
    success_url: `${baseUrl}/g/${gallery.token}?ordered=1`,
    cancel_url: `${baseUrl}/g/${gallery.token}?cancelled=1`,
    metadata: {
      source: 'gallery',
      galleryId: String(gallery._id),
      galleryToken: gallery.token,
    },
    payment_intent_data: {
      metadata: {
        source: 'gallery',
        galleryId: String(gallery._id),
      },
    },
  });

  // Persist a Pending order; webhook will flip to Paid.
  await GalleryOrder.create({
    gallery: gallery._id,
    galleryClientName: gallery.clientName,
    customerEmail: email,
    items: orderItems,
    subtotalMinor,
    totalMinor: subtotalMinor, // shipping added by Stripe; updated on webhook
    currency: CURRENCY,
    fulfillment: fulfillment === 'delivery' ? 'delivery' : 'collection',
    stripeSessionId: session.id,
    status: 'Pending',
  });

  res.json({ url: session.url, sessionId: session.id });
};

module.exports = {
  renderGallery,
  unlockGallery,
  downloadPhoto,
  downloadAll,
  checkout,
};
