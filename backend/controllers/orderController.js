const Order = require('../models/Order');
const Customer = require('../models/Customer');

const createOrder = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail } = req.body;

    if (!customerName || !customerPhone || !customerEmail) {
      return res.status(400).json({ message: 'Customer name, phone and email are required' });
    }

    const phone = customerPhone.trim();
    const email = customerEmail.trim().toLowerCase();

    let customer = await Customer.findOneAndUpdate(
      { $or: [{ phone }, { email }] },
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
    const yearStart = new Date(year, 0, 1);
    const yearCount = await Order.countDocuments({ createdAt: { $gte: yearStart } });
    const invoiceNumber = `INV-${year}-${String(yearCount + 1).padStart(4, '0')}`;

    const order = await Order.create({
      ...req.body,
      invoiceNumber,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
    });

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
  deleteOrder,
};
