const express = require('express');
const router = express.Router();
const {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
} = require('../controllers/partnerController');

router.get('/', getAllPartners);
router.post('/', createPartner);
router.get('/:id', getPartnerById);
router.patch('/:id', updatePartner);
router.delete('/:id', deletePartner);

module.exports = router;
