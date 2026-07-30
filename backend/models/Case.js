const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    caseSeq: { type: Number, required: true, unique: true },
    caseNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
    customerContact: { type: String, required: [true, 'Customer contact is required'], trim: true },
    title: { type: String, required: [true, 'Case title is required'], trim: true },
    issues: { type: String, required: [true, 'Case issues are required'], trim: true },
    createdBy: { type: String, required: [true, 'Created by is required'], trim: true },
    solvedBy: { type: String, default: '', trim: true },
    solutionComment: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['In Processing', 'Solved'],
      default: 'In Processing',
    },
    solvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Case', caseSchema);
