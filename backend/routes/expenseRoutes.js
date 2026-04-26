const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadInvoice, deleteInvoiceFile } = require('../controllers/expenseController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), uploadInvoice);
router.post('/delete-file', deleteInvoiceFile);

module.exports = router;
