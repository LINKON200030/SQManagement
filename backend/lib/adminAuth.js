// Mirrors the x-booking-secret pattern used by the website booking endpoint.
// Plug a real session/JWT middleware in here when the rest of the admin gets one.
const requireAdmin = (req, res, next) => {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    // Fail-closed in production, open in dev so local work isn't blocked.
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ message: 'Admin auth not configured (set ADMIN_SECRET)' });
    }
    return next();
  }
  const header = req.headers['x-admin-secret'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (header !== expected) return res.status(401).json({ message: 'Unauthorized' });
  next();
};

module.exports = { requireAdmin };
