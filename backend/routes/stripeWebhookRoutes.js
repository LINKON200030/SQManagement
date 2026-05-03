const express = require('express');
const Order = require('../models/Order');
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
        const orderId = session.metadata?.orderId;
        await handlePaidOrder(orderId, session.payment_intent);
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
