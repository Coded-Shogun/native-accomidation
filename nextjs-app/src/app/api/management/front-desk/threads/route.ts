/**
 * Front Desk Threads API
 * Lists chat threads filtered to the manager's properties
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER', 'FRONT_DESK'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || '50');

  let propertyFilter: any = {};
  if (session.user.role === 'PROPERTY_MANAGER') {
    propertyFilter = { id: session.user.propertyId || undefined };
  }

  const [threads, total] = await Promise.all([
    prisma.chatThread.findMany({
      where:
        session.user.role === 'PROPERTY_MANAGER' && propertyFilter.id
          ? { propertyId: propertyFilter.id }
          : {},
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: limit,
    }),
    prisma.chatThread.count({
      where:
        session.user.role === 'PROPERTY_MANAGER' && propertyFilter.id
          ? { propertyId: propertyFilter.id }
          : {},
    }),
  ]);

  return NextResponse.json({
    threads,
    total,
  });
}

