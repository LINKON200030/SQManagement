const mongoose = require('mongoose');

const USERS = ['Linkon', 'Raki', 'Babu', 'Balli', 'Johana'];

const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, sparse: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
    customerPhone: { type: String, required: [true, 'Customer phone is required'], trim: true },
    customerEmail: { type: String, required: [true, 'Customer email is required'], trim: true, lowercase: true },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
