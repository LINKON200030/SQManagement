const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    productSku: { type: String, required: true },
    productName: { type: String, required: true },
    photoId: { type: mongoose.Schema.Types.ObjectId, default: null },
    quantity: { type: Number, default: 1, min: 1 },
    unitPriceMinor: { type: Number, required: true, min: 0 },
    kind: { type: String, enum: ['print', 'physical'], default: 'print' },
  },
  { _id: false }
);

const galleryOrderSchema = new mongoose.Schema(
  {
    gallery: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallery', required: true, index: true },
    galleryClientName: { type: String, default: '' },
    customerEmail: { type: String, default: '', lowercase: true, trim: true },
    customerName: { type: String, default: '', trim: true },
    items: { type: [lineItemSchema], default: [] },
    subtotalMinor: { type: Number, default: 0 },
    shippingMinor: { type: Number, default: 0 },
    totalMinor: { type: Number, default: 0 },
    currency: { type: String, default: 'gbp', lowercase: true },
    fulfillment: { type: String, enum: ['collection', 'delivery'], default: 'collection' },
    shippingAddress: { type: Object, default: null },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Fulfilled', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    stripeSessionId: { type: String, default: '', index: true },
    stripePaymentIntentId: { type: String, default: '' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GalleryOrder', galleryOrderSchema);
