const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { createOrderWithRetry } = require('../lib/invoiceNumber');

const DEFAULT_ORDER_BY = 'Linkon';
const DEFAULT_ASSIGNED_TO = 'Linkon';
const DEFAULT_TAG = 'Flexible';

const buildOrderFields = (data) => {
  const type = data.type;

  if (type === 'passport') {
    const qty = data.qty ? ` x${data.qty}` : '';
    const title = `Passport/ID/Visa: ${data.service || 'Unspecified'}${qty}`;
    const parts = [];
    if (data.time) parts.push(`Time: ${data.time}`);
    if (data.total) parts.push(`Estimated total: ${data.total}`);
    if (data.notes) parts.push(`Notes: ${data.notes}`);
    return { title, description: parts.join(' | ') };
  }

  if (type === 'photoshoot') {
    const title = `Photoshoot: ${data.category || 'General'}`;
    const parts = [];
    if (data.address) parts.push(`Address: ${data.address}`);
    if (data.notes) parts.push(`Notes: ${data.notes}`);
    return { title, description: parts.join(' | ') };
  }

  if (type === 'studio-rent') {
    const dur = data.duration ? `${data.duration}h` : '';
    const purpose = data.purpose || 'General';
    const title = `Studio Hire${dur ? ` (${dur})` : ''}: ${purpose}`;
    const parts = [];
    if (data.notes) parts.push(`Notes: ${data.notes}`);
    return { title, description: parts.join(' | ') };
  }

  return { title: 'Website Booking', description: '' };
};

const parseDueDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

const createWebsiteBooking = async (req, res) => {
  try {
    const expected = process.env.WEBSITE_BOOKING_SECRET;
    if (!expected) {
      return res.status(503).json({ message: 'Website booking integration not configured' });
    }
    if (req.headers['x-booking-secret'] !== expected) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = req.body || {};
    const name = (data.name || '').trim();
    const phone = (data.phone || '').trim();
    const email = (data.email || '').trim().toLowerCase();

    if (!name || (!phone && !email)) {
      return res.status(400).json({ message: 'Name and either phone or email are required' });
    }

    const dueDate = parseDueDate(data.date);
    if (!dueDate) {
      return res.status(400).json({ message: 'Valid booking date is required' });
    }

    const lookup = [];
    if (phone) lookup.push({ phone });
    if (email) lookup.push({ email });

    let customer = lookup.length
      ? await Customer.findOneAndUpdate(
          { $or: lookup },
          { $inc: { ordersCount: 1 } },
          { new: true }
        )
      : null;

    if (!customer) {
      customer = await Customer.create({ name, phone, email, ordersCount: 1 });
    }

    const { title, description } = buildOrderFields(data);

    const order = await createOrderWithRetry((invoiceNumber) => ({
      invoiceNumber,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      title,
      description,
      price: 0,
      advancePaid: 0,
      priceStatus: 'Unpaid',
      orderBy: DEFAULT_ORDER_BY,
      assignedTo: DEFAULT_ASSIGNED_TO,
      tag: DEFAULT_TAG,
      dueDate,
      comment: '[Website booking]',
    }));

    res.status(201).json({ ok: true, orderId: order._id, invoiceNumber: order.invoiceNumber });
  } catch (err) {
    console.error('Website booking error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createWebsiteBooking };
