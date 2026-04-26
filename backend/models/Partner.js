const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Partner name is required'], trim: true },
    website: { type: String, default: '', trim: true },
    productTypes: { type: String, default: '', trim: true },
    accountEmail: { type: String, default: '', trim: true },
    accountPassword: { type: String, default: '' },
    contactName: { type: String, default: '', trim: true },
    contactNumber: { type: String, default: '', trim: true },
    contactEmail: { type: String, default: '', trim: true, lowercase: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Partner', partnerSchema);
