import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51U35zFGwXR2mjixCTI9LW44zSJEROh150zGeUijhZGPTSrV9N1JlEbH3exij4U3nfAlkUXYm7lhCazqBeEbIgeJO00KqcadZvV';

export const stripePromise = loadStripe(publishableKey);
