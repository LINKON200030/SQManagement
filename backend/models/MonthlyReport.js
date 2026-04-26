const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    invoiceNumber: { type: String, default: '', trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  },
  { _id: true, timestamps: false }
);

const monthlyReportSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, unique: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    shopTillIncome: { type: Number, default: 0, min: 0 },
    insideTillIncome: { type: Number, default: 0, min: 0 },
    categoryIncome: {
      stationary: { type: Number, default: 0, min: 0 },
      photolab: { type: Number, default: 0, min: 0 },
      photocopies: { type: Number, default: 0, min: 0 },
      lottery: { type: Number, default: 0, min: 0 },
    },
    expenses: { type: [expenseSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MonthlyReport', monthlyReportSchema);
