/**
 * Front Desk Single Thread API
 * Returns a single chat thread with messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    threadId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['ADMIN', 'PROPERTY_MANAGER', 'FRONT_DESK'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const thread = await prisma.chatThread.findUnique({
    where: {
      id: params.threadId,
    },
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
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // If manager, ensure thread belongs to one of their properties (using propertyId on user or staff assignments in future)
  if (
    session.user.role === 'PROPERTY_MANAGER' &&
    session.user.propertyId &&
    thread.propertyId !== session.user.propertyId
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(thread);
}

