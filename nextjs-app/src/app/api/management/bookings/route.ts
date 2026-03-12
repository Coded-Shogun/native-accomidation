/**
 * Bookings Management API
 * Manage short-stay bookings across properties
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

const bookingSchema = z.object({
  propertyId: z.string().cuid(),
  roomId: z.string().cuid().optional().nullable(),
  userId: z.string().cuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z
    .enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
    .optional(),
  source: z.enum(['manual', 'online', 'channel']).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * GET /api/management/bookings
 * List bookings with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (upcoming) {
      where.startsAt = { gte: new Date() };
    }

    if (session.user.role === 'PROPERTY_MANAGER') {
      const managerProperties = await prisma.property.findMany({
        where: { managerId: session.user.id },
        select: { id: true },
      });
      const ids = managerProperties.map((p) => p.id);

      if (!where.propertyId) {
        where.propertyId = { in: ids };
      } else if (where.propertyId && !where.propertyId.in) {
        where.propertyId = { in: ids.filter((id) => id === where.propertyId) };
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        take: limit,
        skip: offset,
        include: {
          property: {
            select: { name: true, city: true },
          },
          room: {
            select: { roomNumber: true, floor: true },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'bookings',
      action: 'READ',
      metadata: { propertyId, status, count: bookings.length },
    });

    return NextResponse.json({ bookings, total, limit, offset });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/management/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (endsAt <= startsAt) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        ...data,
        startsAt,
        endsAt,
        status: data.status || 'pending',
        source: data.source || 'manual',
      },
    });

    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'booking',
      resourceId: booking.id,
      success: true,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

