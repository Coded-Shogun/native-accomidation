/**
 * Student Maintenance Requests API
 * Create and view maintenance requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const maintenanceRequestSchema = z.object({
  category: z.enum([
    'electrical',
    'plumbing',
    'heating_cooling',
    'appliances',
    'furniture',
    'doors_windows',
    'pest_control',
    'cleaning',
    'security',
    'other',
  ]),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']),
  location: z.string().min(2).max(200),
  preferredTimeSlot: z.string().optional(),
  contactPhone: z.string().optional(),
});

/**
 * GET /api/student/maintenance-requests
 * Get student's maintenance requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      studentId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    // Fetch maintenance requests
    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        orderBy: [
          { urgency: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
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
      metadata: { status, count: requests.length },
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

/**
 * POST /api/student/maintenance-requests
 * Create new maintenance request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = maintenanceRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get student's property via profile
    if (!session.user.studentProfileId) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: session.user.studentProfileId },
      select: { propertyId: true },
    });

    if (!student?.propertyId) {
      return NextResponse.json(
        { error: 'No property assigned' },
        { status: 400 }
      );
    }

    // Get student's active lease
    const lease = await prisma.lease.findFirst({
      where: {
        studentId: session.user.id,
        leaseStatus: 'active',
      },
      select: { roomId: true },
    });

    if (!lease?.roomId) {
      return NextResponse.json(
        { error: 'No active lease found' },
        { status: 400 }
      );
    }

    // Create maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        studentId: session.user.id,
        propertyId: student.propertyId,
        roomId: lease.roomId,
        category: data.category,
        title: data.title,
        description: data.description,
        urgency: data.urgency,
        location: data.location,
        preferredTimeSlot: data.preferredTimeSlot,
        contactPhone: data.contactPhone || null,
        status: 'submitted',
        priority: data.urgency === 'emergency' ? 'urgent' : 'normal',
      },
      include: {
        room: {
          select: {
            roomNumber: true,
            floor: true,
          },
        },
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'maintenance_request',
      resourceId: maintenanceRequest.id,
      success: true,
      metadata: {
        category: data.category,
        urgency: data.urgency,
      },
    });

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance request:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'maintenance_request',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to create maintenance request' },
      { status: 500 }
    );
  }
}
