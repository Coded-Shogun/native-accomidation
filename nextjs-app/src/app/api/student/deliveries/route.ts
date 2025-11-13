/**
 * Student Deliveries API
 * View package/parcel deliveries
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess } from '@/lib/logger';

/**
 * GET /api/student/deliveries
 * Get student's package deliveries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const uncollected = searchParams.get('uncollected') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      studentId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (uncollected) {
      where.status = { in: ['received', 'ready_for_pickup'] };
      where.collectedAt = null;
    }

    // Fetch deliveries
    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        orderBy: { receivedDate: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          trackingNumber: true,
          courier: true,
          description: true,
          receivedDate: true,
          collectedAt: true,
          status: true,
          storageLocation: true,
          receivedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          collectedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
        },
      }),
      prisma.delivery.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'deliveries',
      action: 'READ',
      metadata: { status, uncollected, count: deliveries.length },
    });

    return NextResponse.json({
      deliveries,
      total,
      limit,
      offset,
      uncollectedCount: uncollected
        ? total
        : await prisma.delivery.count({
            where: {
              studentId: session.user.id,
              status: { in: ['received', 'ready_for_pickup'] },
              collectedAt: null,
            },
          }),
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}
