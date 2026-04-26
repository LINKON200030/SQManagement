const express = require('express');
const router = express.Router();
const {
  listReports,
  getReport,
  upsertReport,
  deleteReport,
  downloadBundle,
} = require('../controllers/monthlyReportController');

router.get('/', listReports);
router.get('/:year/:month', getReport);
router.get('/:year/:month/bundle.pdf', downloadBundle);
router.put('/:year/:month', upsertReport);
router.delete('/:year/:month', deleteReport);

module.exports = router;
