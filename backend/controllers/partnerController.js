const Partner = require('../models/Partner');

const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    res.json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPartner = async (req, res) => {
  try {
    const partner = await Partner.create(req.body);
    res.status(201).json(partner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    res.json(partner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    res.json({ message: 'Partner deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
};
