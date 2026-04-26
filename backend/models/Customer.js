const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    ordersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
