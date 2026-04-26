const express = require('express');
const router = express.Router();
const {
  listReports,
  getReport,
  upsertReport,
  deleteReport,
} = require('../controllers/monthlyReportController');

router.get('/', listReports);
router.get('/:year/:month', getReport);
router.put('/:year/:month', upsertReport);
router.delete('/:year/:month', deleteReport);

module.exports = router;
