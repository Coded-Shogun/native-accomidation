/**
 * Regulatory Settings API
 * Returns regulatory bodies and basic property compliance records
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let propertyFilter: any = {};
  if (session.user.role === 'PROPERTY_MANAGER') {
    propertyFilter = { id: session.user.propertyId || undefined };
  }

  const [bodies, compliance] = await Promise.all([
    prisma.regulatoryBody.findMany({
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.regulatoryCompliance.findMany({
      where:
        session.user.role === 'PROPERTY_MANAGER' && propertyFilter.id
          ? {
              propertyId: propertyFilter.id,
            }
          : {},
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        regulatoryBody: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    }),
  ]);

  return NextResponse.json({
    bodies,
    compliance,
  });
}

