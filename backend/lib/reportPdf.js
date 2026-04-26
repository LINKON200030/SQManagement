const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const { getObjectBuffer } = require('./r2');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COMPANY_NAME = 'Surrey Quays Photo Studio Ltd.';

const fmt = (n) =>
  '£' + (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const buildReportPdf = (report) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const monthLabel = `${MONTH_NAMES[report.month - 1]} ${report.year}`;

      // Header
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#000')
        .text(COMPANY_NAME, { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(12).fillColor('#dc2626')
        .text(`Monthly Report — ${monthLabel}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#000').lineWidth(2).stroke();
      doc.moveDown(1);

      // Total Income section
      sectionTitle(doc, 'Total Income');
      const shop = Number(report.shopTillIncome) || 0;
      const inside = Number(report.insideTillIncome) || 0;
      const totalIncome = shop + inside;
      kvLine(doc, 'Shop Till', fmt(shop));
      kvLine(doc, 'Inside Till', fmt(inside));
      doc.moveDown(0.3);
      totalLine(doc, 'Monthly Total Income', fmt(totalIncome), '#000');
      doc.moveDown(0.8);

      // Category-wise income
      sectionTitle(doc, 'Category-wise Income');
      const cat = report.categoryIncome || {};
      kvLine(doc, 'Stationary', fmt(cat.stationary));
      kvLine(doc, 'Photolab', fmt(cat.photolab));
      kvLine(doc, 'Photocopies', fmt(cat.photocopies));
      kvLine(doc, 'Lottery / Scratch Card', fmt(cat.lottery));
      doc.moveDown(0.8);

      // Expenses table
      sectionTitle(doc, 'Expenses');
      const expenses = report.expenses || [];

      const colX = { name: 40, inv: 230, total: 380, status: 470 };
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b');
      doc.text('COMPANY NAME', colX.name, doc.y, { continued: false });
      const headY = doc.y - 10;
      doc.text('INVOICE NO.', colX.inv, headY);
      doc.text('TOTAL', colX.total, headY, { width: 80, align: 'right' });
      doc.text('STATUS', colX.status, headY);
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#000').lineWidth(1).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(10).fillColor('#000');
      let totalExpense = 0;
      let totalPaid = 0;
      let totalDue = 0;
      if (expenses.length === 0) {
        doc.fillColor('#94a3b8').font('Helvetica-Oblique')
          .text('No expenses added.', 40, doc.y);
      } else {
        for (const e of expenses) {
          const rowY = doc.y;
          const amt = Number(e.totalAmount) || 0;
          totalExpense += amt;
          if (e.status === 'Paid') totalPaid += amt; else totalDue += amt;

          doc.font('Helvetica').fontSize(10).fillColor('#000');
          doc.text(e.companyName || '', colX.name, rowY, { width: 180 });
          doc.text(e.invoiceNumber || '—', colX.inv, rowY, { width: 140 });
          doc.text(fmt(amt), colX.total, rowY, { width: 80, align: 'right' });
          doc.fillColor(e.status === 'Paid' ? '#047857' : '#b91c1c')
            .text(e.status || 'Unpaid', colX.status, rowY);
          doc.fillColor('#000');
          doc.moveDown(0.3);
        }
      }

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      doc.moveDown(0.6);

      // Summary boxes
      summaryBox(doc, 40, 165, 'Total Expense', fmt(totalExpense), '#000', '#fff');
      summaryBox(doc, 215, 165, 'Paid', fmt(totalPaid), '#ecfdf5', '#047857');
      summaryBox(doc, 390, 165, 'Due', fmt(totalDue), '#fef2f2', '#b91c1c');

      // Footer
      doc.fontSize(8).fillColor('#94a3b8')
        .text(COMPANY_NAME, 40, 800, { align: 'left', width: 250 })
        .text(`Generated ${new Date().toLocaleDateString('en-GB')}`, 305, 800, {
          align: 'right',
          width: 250,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

function sectionTitle(doc, label) {
  doc.fillColor('#dc2626').rect(40, doc.y + 2, 4, 12).fill();
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
    .text(label.toUpperCase(), 50, doc.y - 12);
  doc.moveDown(0.5);
}

function kvLine(doc, label, value) {
  const y = doc.y;
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text(label, 40, y, { width: 250 });
  doc.font('Helvetica-Bold').fillColor('#000').text(value, 290, y, { width: 265, align: 'right' });
  doc.moveDown(0.2);
}

function totalLine(doc, label, value, bg) {
  const y = doc.y;
  doc.rect(40, y, 515, 22).fill(bg);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10)
    .text(label.toUpperCase(), 50, y + 6);
  doc.text(value, 50, y + 6, { width: 495, align: 'right' });
  doc.fillColor('#000');
  doc.moveDown(1.5);
}

function summaryBox(doc, x, w, label, value, bg, fg) {
  const y = doc.y;
  doc.rect(x, y, w - x, 38).fill(bg);
  doc.fillColor(fg).font('Helvetica-Bold').fontSize(8)
    .text(label.toUpperCase(), x + 8, y + 6, { width: w - x - 16 });
  doc.fontSize(13).text(value, x + 8, y + 18, { width: w - x - 16 });
  doc.fillColor('#000');
}

const buildBundlePdf = async (report) => {
  const reportPdfBytes = await buildReportPdf(report);
  const merged = await PDFLibDocument.create();

  const reportDoc = await PDFLibDocument.load(reportPdfBytes);
  const reportPages = await merged.copyPages(reportDoc, reportDoc.getPageIndices());
  reportPages.forEach((p) => merged.addPage(p));

  const expenses = report.expenses || [];
  for (const e of expenses) {
    if (!e.pdfKey) continue;
    try {
      const buf = await getObjectBuffer(e.pdfKey);
      const invoiceDoc = await PDFLibDocument.load(buf, { ignoreEncryption: true });
      const invoicePages = await merged.copyPages(invoiceDoc, invoiceDoc.getPageIndices());
      invoicePages.forEach((p) => merged.addPage(p));
    } catch (err) {
      console.warn('Skipping invoice in bundle (load failed):', e.pdfKey, err.message);
    }
  }

  const bytes = await merged.save();
  return Buffer.from(bytes);
};

module.exports = { buildBundlePdf };
