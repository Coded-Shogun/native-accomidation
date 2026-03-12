/**
 * Student Complaints API
 * Submit and track complaints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const complaintSchema = z.object({
  category: z.enum([
    'noise',
    'cleanliness',
    'facilities',
    'security',
    'staff_conduct',
    'room_condition',
    'billing',
    'discrimination',
    'harassment',
    'safety',
    'other',
  ]),
  subject: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  anonymous: z.boolean().optional(),
  incidentDate: z.string().datetime().optional(),
  witnessNames: z.string().max(500).optional(),
  actionRequested: z.string().max(1000).optional(),
});

/**
 * GET /api/student/complaints
 * Get student's complaints
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

    // Fetch complaints
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        select: {
          id: true,
          category: true,
          subject: true,
          description: true,
          severity: true,
          status: true,
          resolution: true,
          anonymous: true,
          incidentDate: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'complaints',
      action: 'READ',
      metadata: { status, count: complaints.length },
    });

    return NextResponse.json({
      complaints,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/complaints
 * Submit a new complaint
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = complaintSchema.safeParse(body);
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

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        studentId: session.user.id,
        propertyId: student.propertyId,
        category: data.category,
        subject: data.subject,
        description: data.description,
        severity: data.severity,
        anonymous: data.anonymous || false,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : null,
        witnessNames: data.witnessNames || null,
        actionRequested: data.actionRequested || null,
        status: 'submitted',
        priority: data.severity === 'critical' ? 'urgent' : data.severity === 'high' ? 'high' : 'normal',
      },
    });

    // Audit log (redact student ID if anonymous)
    logAudit({
      userId: data.anonymous ? 'ANONYMOUS' : session.user.id,
      action: 'CREATE',
      resource: 'complaint',
      resourceId: complaint.id,
      success: true,
      metadata: {
        category: data.category,
        severity: data.severity,
        anonymous: data.anonymous,
      },
    });

    // For critical complaints, log security event
    if (data.severity === 'critical') {
      logAudit({
        userId: session.user.id,
        action: 'ALERT',
        resource: 'complaint',
        resourceId: complaint.id,
        success: true,
        metadata: {
          type: 'critical_complaint',
          category: data.category,
        },
      });
    }

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('Error submitting complaint:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'complaint',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to submit complaint' },
      { status: 500 }
    );
  }
}
