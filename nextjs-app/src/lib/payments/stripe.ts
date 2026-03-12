import { env } from '@/env';

// Lazy-load Stripe to avoid issues if not installed in some environments.
let stripeClient: any;

function getStripe() {
  if (!stripeClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return stripeClient;
}

export interface StripeIntentParams {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export async function createStripePaymentIntent(params: StripeIntentParams) {
  const stripe = getStripe();

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100),
    currency: params.currency.toLowerCase(),
    metadata: params.metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return intent;
}

