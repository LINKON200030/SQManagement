const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { getStripe } = require('../lib/stripe');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://sqmanagement.vercel.app').replace(/\/$/, '');
const CURRENCY = (process.env.STRIPE_CURRENCY || 'gbp').toLowerCase();

const computeChargeAmount = (order) => {
  const price = Number(order.price) || 0;
  const advance = Number(order.advancePaid) || 0;
  if (order.chargeMode === 'full') return price;
  return Math.max(price - advance, 0);
};

const createCheckoutSessionForOrder = async (order) => {
  const stripe = getStripe();
  if (!stripe) return null;

  const amount = computeChargeAmount(order);
  if (amount <= 0) return null;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: order.title || `Invoice ${order.invoiceNumber}`,
            description: order.invoiceNumber,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: order.customerEmail || undefined,
    client_reference_id: String(order._id),
    metadata: {
      orderId: String(order._id),
      invoiceNumber: order.invoiceNumber || '',
      chargeMode: order.chargeMode || 'remaining',
    },
    success_url: `${FRONTEND_URL}/invoice/${order._id}?paid=1`,
    cancel_url: `${FRONTEND_URL}/invoice/${order._id}`,
  });

  return session;
};

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
    const chargeMode = req.body.chargeMode === 'full' ? 'full' : 'remaining';

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
          chargeMode,
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

    try {
      const session = await createCheckoutSessionForOrder(order);
      if (session) {
        order.paymentLinkUrl = session.url;
        order.stripeSessionId = session.id;
        await order.save();
      }
    } catch (err) {
      console.error('Stripe Checkout Session creation failed:', err.message);
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

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const regeneratePaymentLink = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const session = await createCheckoutSessionForOrder(order);
    if (!session) {
      return res
        .status(400)
        .json({ message: 'Cannot create payment link (Stripe not configured or amount is zero).' });
    }
    order.paymentLinkUrl = session.url;
    order.stripeSessionId = session.id;
    await order.save();
    res.json(order);
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
  regeneratePaymentLink,
};
