/**
 * Leases Management API
 * Manage student accommodation leases
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const leaseSchema = z.object({
  studentId: z.string().uuid(),
  roomId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  monthlyRent: z.number().min(0),
  securityDeposit: z.number().min(0).optional(),
  leaseType: z.enum(['semester', 'academic_year', 'monthly', 'fixed_term']),
  leaseStatus: z.enum(['pending', 'active', 'expired', 'terminated', 'renewed']).optional(),
  specialConditions: z.string().max(2000).optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
});

/**
 * GET /api/management/leases
 * Get leases with filters
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
    const studentId = searchParams.get('studentId');
    const propertyId = searchParams.get('propertyId');
    const roomId = searchParams.get('roomId');
    const leaseStatus = searchParams.get('leaseStatus');
    const expiringDays = searchParams.get('expiringDays'); // Leases expiring in N days
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    // Managers can only see leases at their properties
    if (session.user.role === 'manager') {
      const managerProperties = await prisma.property.findMany({
        where: { managerId: session.user.id },
        select: { id: true },
      });
      const propertyIds = managerProperties.map(p => p.id);

      where.room = {
        propertyId: { in: propertyIds },
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (propertyId) {
      where.room = { ...where.room, propertyId };
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (leaseStatus) {
      where.leaseStatus = leaseStatus;
    }

    if (expiringDays) {
      const daysAhead = parseInt(expiringDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      where.endDate = {
        gte: new Date(),
        lte: futureDate,
      };
      where.leaseStatus = 'active';
    }

    // Fetch leases
    const [leases, total] = await Promise.all([
      prisma.lease.findMany({
        where,
        orderBy: { startDate: 'desc' },
        take: limit,
        skip: offset,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              studentNumber: true,
            },
          },
          room: {
            select: {
              roomNumber: true,
              floor: true,
              roomType: true,
              property: {
                select: {
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
      }),
      prisma.lease.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'leases',
      action: 'READ',
      metadata: { leaseStatus, propertyId, count: leases.length },
    });

    return NextResponse.json({
      leases,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching leases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leases' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/management/leases
 * Create a new lease
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = leaseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if room exists and is available
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: {
        property: {
          select: {
            managerId: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Managers can only create leases at their properties
    if (session.user.role === 'manager' && room.property.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (room.occupancyStatus === 'occupied') {
      return NextResponse.json(
        { error: 'Room is already occupied' },
        { status: 400 }
      );
    }

    // Check for overlapping leases for the same room
    const overlappingLease = await prisma.lease.findFirst({
      where: {
        roomId: data.roomId,
        leaseStatus: { in: ['pending', 'active'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlappingLease) {
      return NextResponse.json(
        { error: 'Room has an overlapping lease' },
        { status: 409 }
      );
    }

    // Create lease in a transaction
    const lease = await prisma.$transaction(async (tx) => {
      const newLease = await tx.lease.create({
        data: {
          ...data,
          startDate,
          endDate,
          leaseStatus: data.leaseStatus || 'pending',
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          room: {
            select: {
              roomNumber: true,
              floor: true,
              property: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update room occupancy status
      await tx.room.update({
        where: { id: data.roomId },
        data: { occupancyStatus: 'reserved' },
      });

      // Update student property assignment
      await tx.student.update({
        where: { id: data.studentId },
        data: { propertyId: room.propertyId },
      });

      return newLease;
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'lease',
      resourceId: lease.id,
      success: true,
      metadata: {
        studentId: data.studentId,
        roomId: data.roomId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    return NextResponse.json(lease, { status: 201 });
  } catch (error) {
    console.error('Error creating lease:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'lease',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to create lease' },
      { status: 500 }
    );
  }
}
