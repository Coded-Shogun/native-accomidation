/**
 * Maintenance Requests Management API
 * View and manage maintenance requests from management perspective
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for updates
const maintenanceUpdateSchema = z.object({
  status: z.enum([
    'submitted',
    'acknowledged',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
  ]).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  estimatedCompletionDate: z.string().datetime().nullable().optional(),
  actualCompletionDate: z.string().datetime().nullable().optional(),
  resolutionNotes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
});

/**
 * GET /api/management/maintenance-requests
 * Get maintenance requests with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const category = searchParams.get('category');
    const assignedToId = searchParams.get('assignedToId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    // Managers can only see requests at their properties
    if (session.user.role === 'manager') {
      const managerProperties = await prisma.property.findMany({
        where: { managerId: session.user.id },
        select: { id: true },
      });
      where.propertyId = { in: managerProperties.map(p => p.id) };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (urgency) {
      where.urgency = urgency;
    }

    if (category) {
      where.category = category;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId === 'unassigned' ? null : assignedToId;
    }

    // Fetch maintenance requests
    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        orderBy: [
          { urgency: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          property: {
            select: {
              name: true,
              address: true,
            },
          },
          room: {
            select: {
              roomNumber: true,
              floor: true,
            },
          },
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'maintenance_requests',
      action: 'READ',
      metadata: { status, propertyId, count: requests.length },
    });

    return NextResponse.json({
      requests,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests' },
      { status: 500 }
    );
  }
}
