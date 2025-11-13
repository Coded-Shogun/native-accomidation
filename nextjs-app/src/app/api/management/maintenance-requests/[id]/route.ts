/**
 * Maintenance Request Detail Management API
 * Update and manage specific maintenance request
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
 * GET /api/management/maintenance-requests/:id
 * Get maintenance request details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestId = params.id;

    // Fetch maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
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
            managerId: true,
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
    });

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      );
    }

    // Managers can only access requests at their properties
    if (session.user.role === 'manager' && maintenanceRequest.property.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    logDataAccess({
      userId: session.user.id,
      resource: 'maintenance_request',
      action: 'READ',
      resourceId: requestId,
    });

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/management/maintenance-requests/:id
 * Update maintenance request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestId = params.id;
    const body = await request.json();

    // Validate input
    const validation = maintenanceUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if maintenance request exists
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: {
          select: {
            managerId: true,
          },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      );
    }

    // Managers can only update requests at their properties
    if (session.user.role === 'manager' && existingRequest.property.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If assigning to staff, validate staff member exists
    if (data.assignedToId) {
      const staff = await prisma.manager.findUnique({
        where: { id: data.assignedToId },
      });

      if (!staff) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...data };

    // Parse dates if provided
    if (data.estimatedCompletionDate) {
      updateData.estimatedCompletionDate = new Date(data.estimatedCompletionDate);
    }

    if (data.actualCompletionDate) {
      updateData.actualCompletionDate = new Date(data.actualCompletionDate);
    }

    // If status changed to completed, set completion timestamp
    if (data.status === 'completed' && !data.actualCompletionDate) {
      updateData.actualCompletionDate = new Date();
    }

    // Update maintenance request
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'maintenance_request',
      resourceId: requestId,
      success: true,
      metadata: {
        changes: Object.keys(data),
        statusChanged: data.status && data.status !== existingRequest.status,
        oldStatus: existingRequest.status,
        newStatus: data.status,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating maintenance request:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'UPDATE',
      resource: 'maintenance_request',
      resourceId: params.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to update maintenance request' },
      { status: 500 }
    );
  }
}
