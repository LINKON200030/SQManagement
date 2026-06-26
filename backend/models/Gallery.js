const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    r2KeyWeb: { type: String, required: true },
    r2KeyFull: { type: String, required: true },
    originalName: { type: String, default: '', trim: true },
    contentType: { type: String, default: 'image/jpeg', trim: true },
    bytes: { type: Number, default: 0 },
    isHighlight: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const settingsSchema = new mongoose.Schema(
  {
    downloadEnabled: { type: Boolean, default: false },
    watermarkEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const gallerySchema = new mongoose.Schema(
  {
    clientName: { type: String, required: [true, 'Client name is required'], trim: true },
    shootDate: { type: Date, required: [true, 'Shoot date is required'] },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    token: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    // Photo used for the cover hero. Null = fall back to the first photo
    // at render time so admin doesn't HAVE to pick one.
    coverPhotoId: { type: mongoose.Schema.Types.ObjectId, default: null },
    settings: { type: settingsSchema, default: () => ({}) },
    photos: { type: [photoSchema], default: [] },
  },
  { timestamps: true }
);

gallerySchema.virtual('hasPassword').get(function () {
  return Boolean(this.passwordHash);
});

gallerySchema.set('toJSON', { virtuals: true });
gallerySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Gallery', gallerySchema);
