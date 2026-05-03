const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { buildPaymentLinksForOrder, deactivatePaymentLink } = require('../lib/stripe');
const { createOrderWithRetry } = require('../lib/invoiceNumber');

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

    const order = await createOrderWithRetry((invoiceNumber) => ({
      ...req.body,
      invoiceNumber,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
    }));

    try {
      const links = await buildPaymentLinksForOrder(order);
      Object.assign(order, links);
      await order.save();
    } catch (stripeErr) {
      console.error('Stripe payment link creation failed:', stripeErr.message);
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
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Order not found' });

    const priceChanged =
      req.body.price !== undefined && Number(req.body.price) !== Number(existing.price);
    const advanceChanged =
      req.body.advancePaid !== undefined &&
      Number(req.body.advancePaid) !== Number(existing.advancePaid);

    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if ((priceChanged || advanceChanged) && order.priceStatus !== 'Paid') {
      try {
        await Promise.all([
          deactivatePaymentLink(order.stripeFullPaymentLinkId),
          order.stripeBalancePaymentLinkId &&
          order.stripeBalancePaymentLinkId !== order.stripeFullPaymentLinkId
            ? deactivatePaymentLink(order.stripeBalancePaymentLinkId)
            : Promise.resolve(),
        ]);
        const links = await buildPaymentLinksForOrder(order);
        Object.assign(order, links);
        await order.save();
      } catch (stripeErr) {
        console.error('Stripe payment link refresh failed:', stripeErr.message);
      }
    }

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
