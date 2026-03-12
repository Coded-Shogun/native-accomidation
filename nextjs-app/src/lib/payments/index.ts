import { buildPayfastFormUrl } from './payfast';
import { createStripePaymentIntent } from './stripe';

export type PaymentGateway = 'payfast' | 'stripe' | 'cash_only';

export interface UnifiedPaymentIntentParams {
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  description: string;
  reference: string;
}

export async function createUnifiedPaymentIntent(
  params: UnifiedPaymentIntentParams
): Promise<
  | { gateway: 'payfast'; redirectUrl: string }
  | { gateway: 'stripe'; clientSecret: string }
  | { gateway: 'cash_only'; message: string }
> {
  if (params.gateway === 'payfast') {
    const redirectUrl = buildPayfastFormUrl({
      amount: params.amount,
      itemName: params.description,
      mPaymentId: params.reference,
    });
    return { gateway: 'payfast', redirectUrl };
  }

  if (params.gateway === 'stripe') {
    const intent = await createStripePaymentIntent({
      amount: params.amount,
      currency: params.currency,
      metadata: {
        reference: params.reference,
      },
    });
    return { gateway: 'stripe', clientSecret: intent.client_secret as string };
  }

  return {
    gateway: 'cash_only',
    message: 'Cash payment to be collected at reception.',
  };
}

