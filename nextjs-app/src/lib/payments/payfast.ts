import { env } from '@/env';
import crypto from 'crypto';

export interface PayfastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  notifyUrl: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayfastInitiateParams {
  amount: number;
  itemName: string;
  itemDescription?: string;
  mPaymentId: string; // your internal reference (e.g. order ID)
}

export function getPayfastConfig(): PayfastConfig {
  return {
    merchantId: env.PAYFAST_MERCHANT_ID,
    merchantKey: env.PAYFAST_MERCHANT_KEY,
    passphrase: env.PAYFAST_PASSPHRASE,
    notifyUrl: `${env.NEXT_PUBLIC_APP_URL}/api/payments/payfast/notify`,
    returnUrl: `${env.NEXT_PUBLIC_APP_URL}/payments/success`,
    cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
  };
}

export function buildPayfastFormUrl(params: PayfastInitiateParams): string {
  const cfg = getPayfastConfig();

  const data: Record<string, string> = {
    merchant_id: cfg.merchantId,
    merchant_key: cfg.merchantKey,
    return_url: cfg.returnUrl,
    cancel_url: cfg.cancelUrl,
    notify_url: cfg.notifyUrl,
    m_payment_id: params.mPaymentId,
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
  };

  if (params.itemDescription) {
    data.item_description = params.itemDescription;
  }

  const query = new URLSearchParams(data).toString();
  const baseUrl =
    env.NODE_ENV === 'production'
      ? 'https://www.payfast.co.za/eng/process'
      : 'https://sandbox.payfast.co.za/eng/process';

  return `${baseUrl}?${query}`;
}

// Verify ITN signature per PayFast docs
export function verifyPayfastSignature(
  payload: Record<string, string | undefined>
): boolean {
  const pfData: Record<string, string> = {};
  Object.keys(payload)
    .sort()
    .forEach((key) => {
      const value = payload[key];
      if (key !== 'signature' && typeof value === 'string') {
        pfData[key] = value;
      }
    });

  let pfParamString = Object.entries(pfData)
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
    .join('&');

  if (env.PAYFAST_PASSPHRASE) {
    pfParamString += `&passphrase=${encodeURIComponent(env.PAYFAST_PASSPHRASE).replace(
      /%20/g,
      '+'
    )}`;
  }

  const signature = crypto.createHash('md5').update(pfParamString).digest('hex');
  return signature === payload.signature;
}

