import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createUnifiedPaymentIntent, PaymentGateway } from '@/lib/payments';
import { z } from 'zod';

const intentSchema = z.object({
  propertyId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().default('ZAR'),
  description: z.string().min(3).max(200),
  reference: z.string().min(3).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = intentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: {
        id: true,
        name: true,
        paymentGateway: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const gateway = (property.paymentGateway || 'cash_only') as PaymentGateway;

    const result = await createUnifiedPaymentIntent({
      gateway,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      reference: data.reference,
    });

    return NextResponse.json(
      {
        gateway: result.gateway,
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

