const Stripe = require('stripe');

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : '';
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is missing in server/.env or Render environment configuration.');
  }
  return Stripe(secretKey);
};

module.exports = getStripe;
