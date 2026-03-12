import { NextRequest, NextResponse } from 'next/server';
import { verifyPayfastSignature } from '@/lib/payments/payfast';
import { prisma } from '@/lib/db';
import logger, { logAudit } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // PayFast sends application/x-www-form-urlencoded
  const text = await request.text();
  const params = new URLSearchParams(text);

  const payload: Record<string, string> = {};
  params.forEach((value, key) => {
    payload[key] = value;
  });

  try {
    const signatureOk = verifyPayfastSignature(payload);
    if (!signatureOk) {
      logger.warn('Invalid PayFast signature', { payload });
      return NextResponse.json({ status: 'invalid-signature' }, { status: 400 });
    }

    const mPaymentId = payload['m_payment_id'];
    const paymentStatus = payload['payment_status']; // COMPLETE, FAILED, etc.

    if (!mPaymentId) {
      return NextResponse.json({ status: 'missing-reference' }, { status: 400 });
    }

    // Example: treat m_payment_id as Payment.id or ServiceOrder.id
    await prisma.payment.updateMany({
      where: { id: mPaymentId },
      data: {
        paymentStatus: paymentStatus === 'COMPLETE' ? 'completed' : 'failed',
        paymentReference: payload['pf_payment_id'],
      },
    });

    logAudit({
      action: 'UPDATE',
      resource: 'payment',
      resourceId: mPaymentId,
      success: true,
      changes: {
        gateway: 'payfast',
        status: paymentStatus,
      },
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    logger.error('PayFast ITN processing error', { error, payload });
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

