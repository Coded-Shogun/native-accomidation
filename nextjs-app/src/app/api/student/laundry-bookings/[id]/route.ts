/**
 * Student Laundry Booking Detail API
 * Cancel specific laundry booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/logger';

/**
 * DELETE /api/student/laundry-bookings/:id
 * Cancel a laundry booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Check if booking exists and belongs to student
    const booking = await prisma.laundryBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only cancel your own bookings' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled (at least 2 hours before)
    const now = new Date();
    const bookingTime = new Date(booking.bookingDate);
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
      return NextResponse.json(
        { error: 'Bookings must be cancelled at least 2 hours in advance' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const updatedBooking = await prisma.laundryBooking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'laundry_booking',
      resourceId: bookingId,
      success: true,
      metadata: {
        originalBookingDate: booking.bookingDate.toISOString(),
        timeSlot: booking.timeSlot,
      },
    });

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error cancelling laundry booking:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'DELETE',
      resource: 'laundry_booking',
      resourceId: params.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
