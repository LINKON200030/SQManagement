const Stripe = require('stripe');

const secret = process.env.STRIPE_SECRET_KEY;
const stripe = secret ? new Stripe(secret, { apiVersion: '2024-06-20' }) : null;

const currency = (process.env.STRIPE_CURRENCY || 'gbp').toLowerCase();
const promoMessage =
  process.env.STRIPE_PROMO_MESSAGE ||
  'Thank you for choosing Surrey Quays Photo Studio. Pay securely below.';

const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

const createPaymentLinkForOrder = async ({ order, amount, kind }) => {
  if (!stripe) throw new Error('Stripe is not configured');
  if (!amount || amount <= 0) return null;

  const productName = order.title || `Invoice ${order.invoiceNumber}`;
  const description =
    kind === 'balance'
      ? `Remaining balance for ${order.invoiceNumber}`
      : `Full payment for ${order.invoiceNumber}`;

  const price = await stripe.prices.create({
    currency,
    unit_amount: toMinorUnits(amount),
    product_data: { name: productName },
  });

  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      orderId: String(order._id),
      invoiceNumber: order.invoiceNumber || '',
      kind,
    },
    payment_intent_data: {
      description,
      metadata: {
        orderId: String(order._id),
        invoiceNumber: order.invoiceNumber || '',
        kind,
      },
    },
    custom_text: {
      submit: { message: promoMessage },
    },
    after_completion: {
      type: 'hosted_confirmation',
      hosted_confirmation: {
        custom_message: `Thanks ${order.customerName || ''}! Your payment for ${order.invoiceNumber} has been received.`,
      },
    },
  });

  return { id: link.id, url: link.url };
};

const buildPaymentLinksForOrder = async (order) => {
  const total = Number(order.price) || 0;
  const advance = Number(order.advancePaid) || 0;
  const balance = Math.max(total - advance, 0);

  const result = {
    stripeFullPaymentUrl: '',
    stripeFullPaymentLinkId: '',
    stripeBalancePaymentUrl: '',
    stripeBalancePaymentLinkId: '',
  };

  if (total > 0) {
    const full = await createPaymentLinkForOrder({ order, amount: total, kind: 'full' });
    if (full) {
      result.stripeFullPaymentUrl = full.url;
      result.stripeFullPaymentLinkId = full.id;
    }
  }

  if (balance > 0 && balance !== total) {
    const bal = await createPaymentLinkForOrder({ order, amount: balance, kind: 'balance' });
    if (bal) {
      result.stripeBalancePaymentUrl = bal.url;
      result.stripeBalancePaymentLinkId = bal.id;
    }
  } else if (balance > 0 && balance === total && result.stripeFullPaymentUrl) {
    result.stripeBalancePaymentUrl = result.stripeFullPaymentUrl;
    result.stripeBalancePaymentLinkId = result.stripeFullPaymentLinkId;
  }

  return result;
};

const deactivatePaymentLink = async (linkId) => {
  if (!stripe || !linkId) return;
  try {
    await stripe.paymentLinks.update(linkId, { active: false });
  } catch (e) {
    console.error('Failed to deactivate payment link', linkId, e.message);
  }
};

module.exports = {
  stripe,
  buildPaymentLinksForOrder,
  deactivatePaymentLink,
};
