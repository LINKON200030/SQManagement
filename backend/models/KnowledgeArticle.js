const mongoose = require('mongoose');

const knowledgeArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    category: { type: String, default: 'General', trim: true },
    content: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);
