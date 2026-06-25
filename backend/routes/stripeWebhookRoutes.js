const express = require('express');
const Order = require('../models/Order');
const GalleryOrder = require('../models/GalleryOrder');
const PrintProduct = require('../models/PrintProduct');
const { stripe, deactivatePaymentLink } = require('../lib/stripe');

const router = express.Router();

const handlePaidOrder = async (orderId, paymentIntentId) => {
  if (!orderId) return;
  const order = await Order.findById(orderId);
  if (!order) return;

  order.priceStatus = 'Paid';
  order.advancePaid = order.price;
  order.stripePaidAt = new Date();
  await order.save();

  await Promise.all([
    deactivatePaymentLink(order.stripeFullPaymentLinkId),
    order.stripeBalancePaymentLinkId &&
    order.stripeBalancePaymentLinkId !== order.stripeFullPaymentLinkId
      ? deactivatePaymentLink(order.stripeBalancePaymentLinkId)
      : Promise.resolve(),
  ]);

  console.log(`Order ${order.invoiceNumber} marked as Paid (payment_intent ${paymentIntentId})`);
};

const sendGalleryOrderEmail = async (order) => {
  // Lightweight outbound: log it, then if SMTP/Resend is configured later this
  // is the one place to wire it. Keeping it dependency-free for now.
  console.log(
    `[gallery-order] paid order ${order._id} for ${order.customerEmail} ` +
      `(${order.galleryClientName}) total ${(order.totalMinor / 100).toFixed(2)} ${order.currency}`
  );
};

const handlePaidGalleryOrder = async (session) => {
  const order = await GalleryOrder.findOne({ stripeSessionId: session.id });
  if (!order) {
    console.warn(`Gallery order not found for session ${session.id}`);
    return;
  }
  if (order.status === 'Paid') return; // idempotent

  order.status = 'Paid';
  order.paidAt = new Date();
  order.stripePaymentIntentId = session.payment_intent || '';
  order.totalMinor = session.amount_total ?? order.totalMinor;
  order.shippingMinor = session.shipping_cost?.amount_total ?? 0;
  if (session.shipping_details?.address) {
    order.shippingAddress = session.shipping_details.address;
    order.customerName = session.shipping_details.name || order.customerName;
    order.fulfillment = order.shippingMinor > 0 ? 'delivery' : 'collection';
  }
  if (session.customer_details?.email) {
    order.customerEmail = session.customer_details.email;
  }
  await order.save();

  // Prints are made-to-order so we don't touch stock for them.
  // Physical SKUs ARE inventory-tracked — decrement here.
  for (const item of order.items) {
    if (item.kind !== 'physical') continue;
    await PrintProduct.updateOne(
      { sku: item.productSku, stockQty: { $ne: null } },
      { $inc: { stockQty: -item.quantity } }
    );
  }

  await sendGalleryOrderEmail(order);
};

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) return res.status(503).send('Stripe not configured');

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = JSON.parse(req.body.toString());
        console.warn('STRIPE_WEBHOOK_SECRET not set — webhook signature is NOT verified');
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        if (session.metadata?.source === 'gallery') {
          await handlePaidGalleryOrder(session);
        } else {
          const orderId = session.metadata?.orderId;
          await handlePaidOrder(orderId, session.payment_intent);
        }
      } else if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object;
        const orderId = intent.metadata?.orderId;
        await handlePaidOrder(orderId, intent.id);
      }
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
