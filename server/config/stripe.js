const Stripe = require('stripe');

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.trim() === '') {
    throw new Error('STRIPE_SECRET_KEY is missing in backend .env configuration.');
  }
  return Stripe(secretKey.trim());
};

module.exports = getStripe;

