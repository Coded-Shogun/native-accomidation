/**
 * Student Bursaries API Route
 * Manages student funding assignments and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit, logBursaryAction } from '@/lib/logger';
import { z } from 'zod';

const bursarySchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  bursaryReference: z.string().min(1, 'Bursary reference is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('ZAR'),
  academicYear: z.string().min(4, 'Academic year is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['pending', 'active', 'suspended', 'completed', 'cancelled']).default('active'),
  conditions: z.string().optional(),
  paymentSchedule: z.string().optional(),
});

/**
 * GET /api/management/student-bursaries
 * List student bursaries with filters
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
    const status = searchParams.get('status');
    const providerId = searchParams.get('bursary_provider_id');
    const academicYear = searchParams.get('academic_year');
    const studentId = searchParams.get('student_id');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (providerId) where.providerId = providerId;
    if (academicYear) where.academicYear = academicYear;
    if (studentId) where.studentId = studentId;

    // Fetch bursaries with student and provider info
    const bursaries = await prisma.studentBursary.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            complianceAlerts: {
              where: { status: 'open' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logDataAccess({
      userId: session.user.id,
      resource: 'student_bursaries',
      action: 'READ',
      metadata: { filters: { status, providerId, academicYear, studentId } },
    });

    return NextResponse.json(bursaries);
  } catch (error) {
    console.error('Error fetching student bursaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student bursaries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/management/student-bursaries
 * Assign new bursary to student
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
    const validation = bursarySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if provider exists
    const provider = await prisma.bursaryProvider.findUnique({
      where: { id: data.providerId },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Check if bursary reference already exists
    const existing = await prisma.studentBursary.findUnique({
      where: { bursaryReference: data.bursaryReference },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bursary reference already exists' },
        { status: 409 }
      );
    }

    // Check NSFAS cap compliance if NSFAS provider
    if (provider.type === 'government' && data.amount > 45000) {
      return NextResponse.json(
        { error: 'Amount exceeds NSFAS annual cap of R45,000' },
        { status: 400 }
      );
    }

    // Create bursary
    const bursary = await prisma.studentBursary.create({
      data: {
        studentId: data.studentId,
        providerId: data.providerId,
        bursaryReference: data.bursaryReference,
        amount: data.amount,
        currency: data.currency,
        academicYear: data.academicYear,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status,
        conditions: data.conditions || null,
        paymentSchedule: data.paymentSchedule || null,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
        provider: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log bursary action
    logBursaryAction({
      userId: session.user.id,
      action: 'assign_bursary',
      bursaryId: bursary.id,
      studentId: data.studentId,
      providerId: data.providerId,
      details: {
        amount: data.amount,
        reference: data.bursaryReference,
        academicYear: data.academicYear,
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'student_bursary',
      resourceId: bursary.id,
      success: true,
    });

    return NextResponse.json(bursary, { status: 201 });
  } catch (error) {
    console.error('Error creating student bursary:', error);
    return NextResponse.json(
      { error: 'Failed to create student bursary' },
      { status: 500 }
    );
  }
}
