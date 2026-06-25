const crypto = require('crypto');

// Stateless cookie token: HMAC(galleryId).
// Set after the visitor enters the correct password.
const SECRET = () => process.env.GALLERY_COOKIE_SECRET || process.env.ADMIN_SECRET || 'dev-gallery-secret';
const COOKIE_PREFIX = 'sqg_';
const MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8h

const cookieName = (galleryId) => `${COOKIE_PREFIX}${String(galleryId).slice(-12)}`;

const sign = (galleryId, issuedAt) =>
  crypto
    .createHmac('sha256', SECRET())
    .update(`${galleryId}.${issuedAt}`)
    .digest('hex');

const issueCookie = (res, galleryId) => {
  const issuedAt = Date.now();
  const sig = sign(galleryId, issuedAt);
  const value = `${issuedAt}.${sig}`;
  res.cookie(cookieName(galleryId), value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
};

const hasValidCookie = (req, galleryId) => {
  const raw = req.cookies?.[cookieName(galleryId)];
  if (!raw) return false;
  const [issuedAtStr, sig] = String(raw).split('.');
  const issuedAt = Number(issuedAtStr);
  if (!issuedAt || !sig) return false;
  if (Date.now() - issuedAt > MAX_AGE_MS) return false;
  const expected = sign(galleryId, issuedAt);
  // constant-time compare
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

module.exports = { issueCookie, hasValidCookie, cookieName };
