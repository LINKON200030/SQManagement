const PrintProduct = require('../models/PrintProduct');
const { DEFAULT_CATALOGUE } = require('../lib/defaultCatalogue');

const list = async (req, res) => {
  try {
    const items = await PrintProduct.find().sort({ sortOrder: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const item = await PrintProduct.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await PrintProduct.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Product not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const item = await PrintProduct.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// One-click seed of the studio's full printings catalogue. Idempotent: skips
// any SKU that's already in the DB so re-running won't duplicate or overwrite
// an admin-edited price.
const seedDefaults = async (req, res) => {
  try {
    const existingSkus = new Set(
      (await PrintProduct.find({ sku: { $in: DEFAULT_CATALOGUE.map((p) => p.sku) } }, 'sku').lean())
        .map((p) => p.sku)
    );
    const toInsert = DEFAULT_CATALOGUE.filter((p) => !existingSkus.has(p.sku));
    if (toInsert.length) await PrintProduct.insertMany(toInsert);
    res.json({
      created: toInsert.length,
      skipped: DEFAULT_CATALOGUE.length - toInsert.length,
      total: await PrintProduct.countDocuments(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { list, create, update, remove, seedDefaults };
