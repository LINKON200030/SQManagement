const mongoose = require('mongoose');

// Print catalogue lives in Mongo so prices are authoritative server-side.
// Public checkout never trusts client-supplied amounts — it looks the price up here.
const printProductSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, default: '', trim: true },
    // priceMinor stored as integer pence/cents to avoid float rounding at Stripe.
    priceMinor: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    currency: { type: String, default: 'gbp', lowercase: true, trim: true },
    // 'print' = made-to-order, no stock decrement.
    // 'physical' = real inventory, decrement stockQty on paid order.
    kind: { type: String, enum: ['print', 'physical'], default: 'print' },
    stockQty: { type: Number, default: null },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PrintProduct', printProductSchema);
