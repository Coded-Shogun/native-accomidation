/**
 * Student Accommodation API
 * Get student's accommodation and lease details
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess } from '@/lib/logger';

/**
 * GET /api/student/accommodation
 * Get student's accommodation details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { id: session.user.id },
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
        propertyId: true,
        accountStatus: true,
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            province: true,
            contactPerson: true,
            contactPhone: true,
            contactEmail: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get active lease
    const activeLease = await prisma.lease.findFirst({
      where: {
        studentId: session.user.id,
        leaseStatus: 'active',
      },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            roomType: true,
            sizeSquareMeters: true,
            maxOccupancy: true,
            currentOccupancy: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Get active bursaries
    const bursaries = await prisma.studentBursary.findMany({
      where: {
        studentId: session.user.id,
        status: 'active',
      },
      include: {
        provider: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    const response = {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
        email: student.email,
        phone: student.phone,
        universityName: student.universityName,
        courseOfStudy: student.courseOfStudy,
        yearOfStudy: student.yearOfStudy,
        accountStatus: student.accountStatus,
      },
      property: student.property,
      lease: activeLease,
      bursaries,
    };

    logDataAccess({
      userId: session.user.id,
      resource: 'student_accommodation',
      action: 'READ',
      metadata: { propertyId: student.propertyId },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching student accommodation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accommodation details' },
      { status: 500 }
    );
  }
}
