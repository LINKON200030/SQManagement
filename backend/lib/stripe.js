const Stripe = require('stripe');

let cached = null;

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return cached;
};

const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

module.exports = { getStripe, stripeEnabled };
