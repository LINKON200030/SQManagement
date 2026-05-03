const Order = require('../models/Order');

const nextInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const last = await Order.findOne({ invoiceNumber: new RegExp(`^INV-${year}-`) })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();
  let seq = 1;
  if (last?.invoiceNumber) {
    const parsed = parseInt(last.invoiceNumber.split('-')[2], 10);
    if (Number.isFinite(parsed)) seq = parsed + 1;
  }
  return `INV-${year}-${String(seq).padStart(4, '0')}`;
};

const createOrderWithRetry = async (buildPayload, maxAttempts = 5) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const invoiceNumber = await nextInvoiceNumber();
      return await Order.create(buildPayload(invoiceNumber));
    } catch (err) {
      if (err?.code === 11000 && err?.keyPattern?.invoiceNumber && attempt < maxAttempts - 1) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('Failed to allocate unique invoice number');
};

module.exports = { nextInvoiceNumber, createOrderWithRetry };
