/**
 * Student Laundry Bookings API
 * Book and manage laundry facility slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const laundryBookingSchema = z.object({
  facilityId: z.string().uuid(),
  bookingDate: z.string().datetime(),
  timeSlot: z.string(),
  machineType: z.enum(['washer', 'dryer']),
  notes: z.string().max(500).optional(),
});

/**
 * GET /api/student/laundry-bookings
 * Get student's laundry bookings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming') === 'true';

    // Build where clause
    const where: any = {
      studentId: session.user.id,
    };

    if (upcoming) {
      where.bookingDate = { gte: new Date() };
      where.status = { in: ['confirmed', 'pending'] };
    }

    // Fetch bookings
    const bookings = await prisma.laundryBooking.findMany({
      where,
      orderBy: { bookingDate: upcoming ? 'asc' : 'desc' },
      take: 50,
      include: {
        facility: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    logDataAccess({
      userId: session.user.id,
      resource: 'laundry_bookings',
      action: 'READ',
      metadata: { upcoming, count: bookings.length },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching laundry bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch laundry bookings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/laundry-bookings
 * Create new laundry booking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = laundryBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if facility exists and is active
    const facility = await prisma.laundryFacility.findUnique({
      where: { id: data.facilityId },
    });

    if (!facility || !facility.isActive) {
      return NextResponse.json(
        { error: 'Facility not available' },
        { status: 400 }
      );
    }

    // Check if student is assigned to this property
    const student = await prisma.student.findUnique({
      where: { id: session.user.id },
      select: { propertyId: true },
    });

    if (!student?.propertyId || student.propertyId !== facility.propertyId) {
      return NextResponse.json(
        { error: 'You cannot book facilities at this property' },
        { status: 403 }
      );
    }

    // Check for conflicting bookings
    const bookingDate = new Date(data.bookingDate);
    const conflictingBooking = await prisma.laundryBooking.findFirst({
      where: {
        facilityId: data.facilityId,
        bookingDate,
        timeSlot: data.timeSlot,
        machineType: data.machineType,
        status: { in: ['confirmed', 'pending'] },
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Check student's active bookings limit (max 3 upcoming bookings)
    const activeBookingsCount = await prisma.laundryBooking.count({
      where: {
        studentId: session.user.id,
        bookingDate: { gte: new Date() },
        status: { in: ['confirmed', 'pending'] },
      },
    });

    if (activeBookingsCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 active bookings allowed' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.laundryBooking.create({
      data: {
        studentId: session.user.id,
        facilityId: data.facilityId,
        bookingDate,
        timeSlot: data.timeSlot,
        machineType: data.machineType,
        notes: data.notes || null,
        status: 'confirmed',
      },
      include: {
        facility: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'laundry_booking',
      resourceId: booking.id,
      success: true,
      metadata: {
        facilityId: data.facilityId,
        bookingDate: bookingDate.toISOString(),
        timeSlot: data.timeSlot,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating laundry booking:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'laundry_booking',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to create laundry booking' },
      { status: 500 }
    );
  }
}
