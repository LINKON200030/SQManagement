const mindee = require('mindee');

let client = null;
const getClient = () => {
  if (!client) {
    if (!process.env.MINDEE_API_KEY) {
      throw new Error('MINDEE_API_KEY is not set');
    }
    client = new mindee.Client({ apiKey: process.env.MINDEE_API_KEY });
  }
  return client;
};

const pickValue = (field) => (field && field.value !== undefined ? field.value : null);

const parseInvoice = async ({ buffer, originalName }) => {
  const c = getClient();
  const inputSource = c.docFromBuffer(buffer, originalName || 'invoice.pdf');
  const apiResponse = await c.parse(mindee.product.InvoiceV4, inputSource);
  const prediction = apiResponse.document.inference.prediction;

  const supplier = pickValue(prediction.supplierName);
  const invoiceNumber = pickValue(prediction.invoiceNumber);
  const total = pickValue(prediction.totalAmount) ?? pickValue(prediction.totalIncl);
  const dateStr = pickValue(prediction.date);
  let invoiceDate = null;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) invoiceDate = d.toISOString();
  }

  return {
    companyName: supplier || '',
    invoiceNumber: invoiceNumber || '',
    totalAmount: typeof total === 'number' ? total : 0,
    invoiceDate,
  };
};

module.exports = { parseInvoice };
