/**
 * Single Service Management API
 * Update or delete a kiosk product service
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const serviceUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(100).optional(),
  price: z.number().nonnegative().optional(),
  isAvailable: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = await prisma.kioskProduct.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!service) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (
    session.user.role === 'PROPERTY_MANAGER' &&
    session.user.propertyId &&
    service.propertyId !== session.user.propertyId
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(service);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.kioskProduct.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (
    session.user.role === 'PROPERTY_MANAGER' &&
    session.user.propertyId &&
    existing.propertyId !== session.user.propertyId
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const json = await request.json();
  const parsed = serviceUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.kioskProduct.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.kioskProduct.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (
    session.user.role === 'PROPERTY_MANAGER' &&
    session.user.propertyId &&
    existing.propertyId !== session.user.propertyId
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.kioskProduct.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}

