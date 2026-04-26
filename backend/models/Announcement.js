const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    body: { type: String, default: '', trim: true },
    severity: {
      type: String,
      enum: ['Info', 'Warning', 'Issue'],
      default: 'Info',
    },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
