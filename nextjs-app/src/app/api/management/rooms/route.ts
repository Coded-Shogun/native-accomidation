/**
 * Rooms Management API
 * CRUD operations for property rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const roomSchema = z.object({
  propertyId: z.string().uuid(),
  roomNumber: z.string().min(1).max(20),
  floor: z.number().int(),
  roomType: z.enum(['single', 'double', 'triple', 'quad', 'shared', 'studio', 'apartment']),
  capacity: z.number().int().min(1),
  monthlyRent: z.number().min(0),
  size: z.number().min(0).optional(),
  hasBathroom: z.boolean().optional(),
  hasKitchen: z.boolean().optional(),
  hasAircon: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  accessibility: z.boolean().optional(),
  occupancyStatus: z.enum(['vacant', 'occupied', 'reserved', 'maintenance', 'unavailable']).optional(),
  description: z.string().max(1000).optional(),
});

/**
 * GET /api/management/rooms
 * Get rooms with filters
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
    const occupancyStatus = searchParams.get('occupancyStatus');
    const roomType = searchParams.get('roomType');
    const floor = searchParams.get('floor');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    // Managers can only see rooms at their properties
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

    if (occupancyStatus) {
      where.occupancyStatus = occupancyStatus;
    }

    if (roomType) {
      where.roomType = roomType;
    }

    if (floor) {
      where.floor = parseInt(floor);
    }

    // Fetch rooms
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        orderBy: [
          { propertyId: 'asc' },
          { floor: 'asc' },
          { roomNumber: 'asc' },
        ],
        take: limit,
        skip: offset,
        include: {
          property: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              leases: true,
            },
          },
        },
      }),
      prisma.room.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'rooms',
      action: 'READ',
      metadata: { propertyId, count: rooms.length },
    });

    return NextResponse.json({
      rooms,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/management/rooms
 * Create a new room
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
    const validation = roomSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Managers can only create rooms at their properties
    if (session.user.role === 'manager' && property.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if room number already exists at this property
    const existingRoom = await prisma.room.findFirst({
      where: {
        propertyId: data.propertyId,
        roomNumber: data.roomNumber,
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room number already exists at this property' },
        { status: 409 }
      );
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        ...data,
        occupancyStatus: data.occupancyStatus || 'vacant',
      },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update property available rooms count
    await prisma.property.update({
      where: { id: data.propertyId },
      data: {
        availableRooms: { increment: 1 },
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'room',
      resourceId: room.id,
      success: true,
      metadata: {
        propertyId: data.propertyId,
        roomNumber: data.roomNumber,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'room',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
