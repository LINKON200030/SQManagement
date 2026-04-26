const KnowledgeArticle = require('../models/KnowledgeArticle');

const list = async (req, res) => {
  try {
    const items = await KnowledgeArticle.find().sort({ category: 1, title: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const item = await KnowledgeArticle.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Article not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const item = await KnowledgeArticle.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await KnowledgeArticle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Article not found' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const item = await KnowledgeArticle.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { list, getOne, create, update, remove };
