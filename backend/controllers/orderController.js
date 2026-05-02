const Order = require('../models/Order');
const Customer = require('../models/Customer');

const createOrder = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail } = req.body;

    const phone = (customerPhone || '').trim();
    const email = (customerEmail || '').trim().toLowerCase();

    if (!customerName || (!phone && !email)) {
      return res
        .status(400)
        .json({ message: 'Customer name and either phone or email are required' });
    }

    const lookup = [];
    if (phone) lookup.push({ phone });
    if (email) lookup.push({ email });

    let customer = await Customer.findOneAndUpdate(
      { $or: lookup },
      { $inc: { ordersCount: 1 } },
      { new: true }
    );

    if (!customer) {
      customer = await Customer.create({
        name: customerName.trim(),
        phone,
        email,
        ordersCount: 1,
      });
    }

    const year = new Date().getFullYear();

    const nextInvoiceNumber = async () => {
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

    let order;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        order = await Order.create({
          ...req.body,
          invoiceNumber: await nextInvoiceNumber(),
          customer: customer._id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
        });
        break;
      } catch (err) {
        if (err?.code === 11000 && err?.keyPattern?.invoiceNumber && attempt < 4) continue;
        throw err;
      }
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { assignedTo, priceStatus, status, tag } = req.query;
    const filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priceStatus) filter.priceStatus = priceStatus;
    if (status) filter.status = status;
    if (tag) filter.tag = tag;
    const orders = await Order.find(filter).sort({ dueDate: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTodayOrders = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const orders = await Order.find({ dueDate: { $gte: start, $lte: end } }).sort({ dueDate: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUpcomingOrders = async (req, res) => {
  try {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const orders = await Order.find({ dueDate: { $gt: end } }).sort({ dueDate: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text?.trim() || !author?.trim()) {
      return res.status(400).json({ message: 'text and author are required' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text: text.trim(), author: author.trim(), createdAt: new Date() } } },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getTodayOrders,
  getUpcomingOrders,
  getOrderById,
  updateOrder,
  addNote,
  deleteOrder,
};
