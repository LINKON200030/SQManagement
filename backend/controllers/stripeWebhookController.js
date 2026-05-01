const Order = require('../models/Order');
const { getStripe } = require('../lib/stripe');

const handleStripeWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).send('Stripe not configured');
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    if (secret) {
      event = stripe.webhooks.constructEvent(req.body, signature, secret);
    } else {
      // Unsigned fallback for local testing only — never use in prod.
      event = JSON.parse(req.body.toString('utf8'));
    }
  } catch (err) {
    console.error('Stripe webhook signature failure:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.priceStatus = 'Paid';
          order.advancePaid = Number(order.price) || 0;
          order.stripePaidAt = new Date();
          await order.save();
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handler error:', err.message);
    res.status(500).send('Webhook handler error');
  }
};

module.exports = { handleStripeWebhook };
