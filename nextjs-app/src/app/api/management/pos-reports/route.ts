/**
 * POS Reports API
 * Aggregated revenue stats from Payments and KioskOrders
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

  const [leaseRevenue, serviceOrders] = await Promise.all([
    prisma.payment.aggregate({
      where:
        session.user.role === 'PROPERTY_MANAGER' && propertyFilter.id
          ? {
              lease: {
                propertyId: propertyFilter.id,
              },
              paymentStatus: 'completed',
            }
          : {
              paymentStatus: 'completed',
            },
      _sum: {
        amount: true,
      },
    }),
    prisma.kioskOrder.aggregate({
      where:
        session.user.role === 'PROPERTY_MANAGER' && propertyFilter.id
          ? {
              student: {
                propertyId: propertyFilter.id,
              },
              status: 'completed',
            }
          : {
            status: 'completed',
          },
      _sum: {
        totalAmount: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  return NextResponse.json({
    leaseRevenue: {
      total: leaseRevenue._sum.amount || 0,
    },
    serviceOrders: {
      totalAmount: serviceOrders._sum.totalAmount || 0,
      count: serviceOrders._count._all || 0,
    },
  });
}

