/**
 * Student Bursary Detail API
 * Get or update specific student bursary
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit, logBursaryAction } from '@/lib/logger';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'completed', 'cancelled']).optional(),
  amount: z.number().positive().optional(),
  conditions: z.string().optional(),
  paymentSchedule: z.string().optional(),
});

/**
 * GET /api/management/student-bursaries/[id]
 * Get bursary details with alerts and compliance data
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

    const bursary = await prisma.studentBursary.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            email: true,
            phone: true,
            universityName: true,
            courseOfStudy: true,
            yearOfStudy: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
            reportingFrequency: true,
          },
        },
        complianceAlerts: {
          where: { status: { in: ['open', 'acknowledged'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!bursary) {
      return NextResponse.json({ error: 'Bursary not found' }, { status: 404 });
    }

    // Get recent residence verifications
    const verifications = await prisma.residenceVerification.findMany({
      where: { studentId: bursary.studentId },
      orderBy: { verificationDate: 'desc' },
      take: 5,
    });

    // Get recent conduct records
    const conductRecords = await prisma.conductRecord.findMany({
      where: {
        studentId: bursary.studentId,
        affectsBursary: true,
      },
      orderBy: { incidentDate: 'desc' },
      take: 5,
    });

    const response = {
      ...bursary,
      recentVerifications: verifications,
      conductRecords,
    };

    logDataAccess({
      userId: session.user.id,
      resource: 'student_bursary',
      action: 'READ',
      resourceId: bursary.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bursary details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bursary details' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/management/student-bursaries/[id]
 * Update bursary (typically status changes)
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

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if bursary exists
    const existing = await prisma.studentBursary.findUnique({
      where: { id: params.id },
      include: { student: true, provider: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Bursary not found' }, { status: 404 });
    }

    const data = validation.data;

    // Update bursary
    const bursary = await prisma.studentBursary.update({
      where: { id: params.id },
      data,
    });

    // If status changed to suspended or cancelled, create alert
    if (data.status && ['suspended', 'cancelled'].includes(data.status)) {
      await prisma.bursaryComplianceAlert.create({
        data: {
          studentId: existing.studentId,
          bursaryId: existing.id,
          alertType: 'payment',
          severity: 'critical',
          title: `Bursary ${data.status}`,
          description: `Bursary has been ${data.status} by management.`,
          status: 'open',
        },
      });
    }

    // Log bursary action
    logBursaryAction({
      userId: session.user.id,
      action: 'update_bursary',
      bursaryId: bursary.id,
      studentId: existing.studentId,
      providerId: existing.providerId,
      details: data,
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'student_bursary',
      resourceId: bursary.id,
      changes: JSON.stringify(data),
      success: true,
    });

    return NextResponse.json(bursary);
  } catch (error) {
    console.error('Error updating bursary:', error);
    return NextResponse.json(
      { error: 'Failed to update bursary' },
      { status: 500 }
    );
  }
}
