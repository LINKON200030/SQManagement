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

const uniqueSlug = async (Model, base) => {
  const root = slugify(base);
  let candidate = root;
  for (let i = 0; i < 8; i += 1) {
    const exists = await Model.exists({ slug: candidate });
    if (!exists) return candidate;
    candidate = `${root}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return `${root}-${crypto.randomBytes(4).toString('hex')}`;
};

module.exports = { slugify, uniqueSlug };
