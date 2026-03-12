/**
 * Services Management API
 * Exposes KioskProduct as a generic service catalog with CRUD
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(2).max(100),
  price: z.number().nonnegative(),
  propertyId: z.string().uuid().optional().nullable(),
  isAvailable: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || '100');

  let where: any = {};

  if (session.user.role === 'PROPERTY_MANAGER' && session.user.propertyId) {
    where.propertyId = session.user.propertyId;
  }

  const [services, total] = await Promise.all([
    prisma.kioskProduct.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    }),
    prisma.kioskProduct.count({ where }),
  ]);

  return NextResponse.json({
    services,
    total,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const json = await request.json();
  const parsed = serviceSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const created = await prisma.kioskProduct.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      isAvailable: data.isAvailable ?? true,
      propertyId:
        data.propertyId ??
        (session.user.role === 'PROPERTY_MANAGER'
          ? session.user.propertyId
          : null),
    },
  });

  return NextResponse.json(created, { status: 201 });
}

