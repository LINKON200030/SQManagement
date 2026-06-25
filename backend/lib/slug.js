const crypto = require('crypto');

const slugify = (input = '') =>
  String(input)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'gallery';

// Slugs double as the public URL path, so we always tack on enough random
// bytes (48 bits = 12 hex chars) to make them unguessable. Result looks like
// "john-jane-wedding-2026-06-25-a1b2c3d4e5f6" — human-readable AND secret.
const generateSlug = (base) => `${slugify(base)}-${crypto.randomBytes(6).toString('hex')}`;

// Kept for backward-compat with anywhere still calling the old API. Tries the
// plain slug first, falls back to generateSlug on collision.
const uniqueSlug = async (Model, base) => {
  const root = slugify(base);
  if (!(await Model.exists({ slug: root }))) return root;
  return generateSlug(base);
};

module.exports = { slugify, generateSlug, uniqueSlug };
