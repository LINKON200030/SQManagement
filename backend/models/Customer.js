const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true, index: true },
    email: { type: String, default: '', trim: true, lowercase: true, index: true },
    ordersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

customerSchema.pre('validate', function (next) {
  if (!this.phone?.trim() && !this.email?.trim()) {
    this.invalidate('phone', 'Either phone or email is required');
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
