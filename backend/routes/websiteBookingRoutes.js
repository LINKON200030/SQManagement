const express = require('express');
const router = express.Router();
const { createWebsiteBooking } = require('../controllers/websiteBookingController');

router.post('/', createWebsiteBooking);

module.exports = router;
