const Announcement = require('../models/Announcement');

const list = async (req, res) => {
  try {
    const items = await Announcement.find().sort({ pinned: -1, createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const item = await Announcement.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { list, create, update, remove };
