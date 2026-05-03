const mongoose = require('mongoose');

const USERS = ['Linkon', 'Raki', 'Babu', 'Balli', 'Johana'];

const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, sparse: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
    customerPhone: { type: String, default: '', trim: true },
    customerEmail: { type: String, default: '', trim: true, lowercase: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    advancePaid: { type: Number, default: 0, min: [0, 'Advance cannot be negative'] },
    priceStatus: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    orderBy: { type: String, enum: USERS, required: [true, 'Order by is required'] },
    assignedTo: { type: String, enum: USERS, required: [true, 'Assigned to is required'] },
    tag: { type: String, enum: ['Emergency', 'Flexible'], required: [true, 'Tag is required'] },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    status: { type: String, enum: ['Completed', 'Not Completed'], default: 'Not Completed' },
    comment: { type: String, default: '', trim: true },
    stripeFullPaymentUrl: { type: String, default: '' },
    stripeFullPaymentLinkId: { type: String, default: '' },
    stripeBalancePaymentUrl: { type: String, default: '' },
    stripeBalancePaymentLinkId: { type: String, default: '' },
    stripePaidAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function (next) {
  if (!this.customerPhone?.trim() && !this.customerEmail?.trim()) {
    this.invalidate('customerPhone', 'Either phone or email is required');
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
