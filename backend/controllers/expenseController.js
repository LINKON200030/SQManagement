const { uploadInvoicePdf, deleteObject } = require('../lib/r2');
const { parseInvoice } = require('../lib/mindee');

const uploadInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { buffer, originalname, mimetype } = req.file;

    let extracted = {
      companyName: '',
      invoiceNumber: '',
      totalAmount: 0,
      invoiceDate: null,
    };

    try {
      extracted = await parseInvoice({ buffer, originalName: originalname });
    } catch (err) {
      console.warn('Mindee parse failed, returning blank fields:', err.message);
    }

    const { key, url } = await uploadInvoicePdf({
      buffer,
      originalName: originalname,
      contentType: mimetype || 'application/pdf',
    });

    res.json({
      ...extracted,
      pdfUrl: url,
      pdfKey: key,
    });
  } catch (error) {
    console.error('uploadInvoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteInvoiceFile = async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ message: 'Missing key' });
    await deleteObject(key);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadInvoice, deleteInvoiceFile };
