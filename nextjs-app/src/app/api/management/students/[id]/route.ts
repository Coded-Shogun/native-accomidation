/**
 * Student Detail Management API
 * Get and update specific student
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for updates
const studentUpdateSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  propertyId: z.string().uuid().nullable().optional(),
  accountStatus: z.enum(['active', 'suspended', 'inactive']).optional(),
  nsfasBeneficiary: z.boolean().optional(),
  nsfasReference: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * GET /api/management/students/:id
 * Get student details with bursary and lease info
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

    if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const studentId = params.id;

    // Fetch student with details
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            managerId: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Managers can only access students at their properties
    if (session.user.role === 'PROPERTY_MANAGER' && student.property?.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get active lease
    const activeLease = await prisma.lease.findFirst({
      where: {
        studentId,
        leaseStatus: 'active',
      },
      include: {
        room: {
          select: {
            roomNumber: true,
            floor: true,
            roomType: true,
          },
        },
      },
    });

    // Get bursaries
    const bursaries = await prisma.studentBursary.findMany({
      where: { studentId },
      include: {
        provider: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent maintenance requests
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        category: true,
        title: true,
        status: true,
        urgency: true,
        createdAt: true,
      },
    });

    // Get recent complaints
    const complaints = await prisma.complaint.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        category: true,
        subject: true,
        status: true,
        severity: true,
        createdAt: true,
      },
    });

    logDataAccess({
      userId: session.user.id,
      resource: 'student',
      action: 'READ',
      resourceId: studentId,
    });

    return NextResponse.json({
      ...student,
      activeLease,
      bursaries,
      maintenanceRequests,
      complaints,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/management/students/:id
 * Update student information
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

    if (!['ADMIN', 'PROPERTY_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const studentId = params.id;
    const body = await request.json();

    // Validate input
    const validation = studentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if student exists
    const existingStudent = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        property: {
          select: {
            managerId: true,
          },
        },
      },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Managers can only update students at their properties
    if (session.user.role === 'PROPERTY_MANAGER' && existingStudent.property?.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if email is being changed and is unique
    if (data.email && data.email !== existingStudent.email) {
      const emailExists = await prisma.studentProfile.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Check if property exists (if changing)
    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
      });

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }

      // Managers can only assign students to their properties
      if (session.user.role === 'manager' && property.managerId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Update student
    const updatedStudent = await prisma.studentProfile.update({
      where: { id: studentId },
      data,
      include: {
        property: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'student',
      resourceId: studentId,
      success: true,
      metadata: {
        changes: Object.keys(data),
        accountStatusChanged: data.accountStatus && data.accountStatus !== existingStudent.accountStatus,
      },
    });

    // Log security event if account status changed
    if (data.accountStatus && data.accountStatus !== existingStudent.accountStatus) {
      logAudit({
        userId: session.user.id,
        action: 'ALERT',
        resource: 'student',
        resourceId: studentId,
        success: true,
        metadata: {
          type: 'account_status_change',
          oldStatus: existingStudent.accountStatus,
          newStatus: data.accountStatus,
        },
      });
    }

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'UPDATE',
      resource: 'student',
      resourceId: params.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}
