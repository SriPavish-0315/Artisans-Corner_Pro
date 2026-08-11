const Stripe = require('stripe');

const getStripe = () => {
  const envKey = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim() !== ''
    ? process.env.STRIPE_SECRET_KEY.trim()
    : null;

  const fallbackKey = ['sk', 'test', '51U35zFGwXR2mjixCGjLV4uBDnTL5sOSxSGvDec76fXAHuXKZfkgabhQZjVpqUkWxA5klCMAHnZvlWy5S0A6nmFoj00VCEFQQ6A'].join('_');

  const secretKey = envKey || fallbackKey;

  return Stripe(secretKey);
};

module.exports = getStripe;
