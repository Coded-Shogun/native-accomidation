/**
 * Student Visitors API
 * Register and manage visitor access
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const visitorSchema = z.object({
  visitorName: z.string().min(2).max(200),
  visitorIdNumber: z.string().min(5).max(20),
  visitorPhone: z.string().optional(),
  visitDate: z.string().datetime(),
  visitEndDate: z.string().datetime().optional(),
  purpose: z.string().min(5).max(500),
  relationship: z.string().min(2).max(100),
  vehicleRegistration: z.string().max(20).optional(),
});

/**
 * GET /api/student/visitors
 * Get student's visitor registrations
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
      where.visitDate = { gte: new Date() };
      where.status = { in: ['approved', 'pending'] };
    }

    // Fetch visitor registrations
    const visitors = await prisma.visitorRegistration.findMany({
      where,
      orderBy: { visitDate: upcoming ? 'asc' : 'desc' },
      take: 50,
    });

    logDataAccess({
      userId: session.user.id,
      resource: 'visitor_registrations',
      action: 'READ',
      metadata: { upcoming, count: visitors.length },
    });

    return NextResponse.json(visitors);
  } catch (error) {
    console.error('Error fetching visitor registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor registrations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/visitors
 * Register a new visitor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = visitorSchema.safeParse(body);
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

    // Validate visit dates
    const visitDate = new Date(data.visitDate);
    const visitEndDate = data.visitEndDate ? new Date(data.visitEndDate) : null;

    if (visitDate < new Date()) {
      return NextResponse.json(
        { error: 'Visit date must be in the future' },
        { status: 400 }
      );
    }

    if (visitEndDate && visitEndDate < visitDate) {
      return NextResponse.json(
        { error: 'Visit end date must be after visit date' },
        { status: 400 }
      );
    }

    // Check for maximum duration (e.g., 7 days)
    if (visitEndDate) {
      const durationDays = (visitEndDate.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24);
      if (durationDays > 7) {
        return NextResponse.json(
          { error: 'Maximum visit duration is 7 days' },
          { status: 400 }
        );
      }
    }

    // Check student's pending visitor registrations limit (max 5)
    const pendingCount = await prisma.visitorRegistration.count({
      where: {
        studentId: session.user.id,
        status: 'pending',
      },
    });

    if (pendingCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 pending visitor registrations allowed' },
        { status: 400 }
      );
    }

    // Create visitor registration
    const visitor = await prisma.visitorRegistration.create({
      data: {
        studentId: session.user.id,
        propertyId: student.propertyId,
        visitorName: data.visitorName,
        visitorIdNumber: data.visitorIdNumber,
        visitorPhone: data.visitorPhone || null,
        visitDate,
        visitEndDate,
        purpose: data.purpose,
        relationship: data.relationship,
        vehicleRegistration: data.vehicleRegistration || null,
        status: 'pending', // Requires security approval
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'visitor_registration',
      resourceId: visitor.id,
      success: true,
      metadata: {
        visitorName: data.visitorName,
        visitDate: visitDate.toISOString(),
      },
    });

    return NextResponse.json(visitor, { status: 201 });
  } catch (error) {
    console.error('Error registering visitor:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'visitor_registration',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to register visitor' },
      { status: 500 }
    );
  }
}
