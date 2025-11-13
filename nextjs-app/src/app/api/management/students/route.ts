/**
 * Students Management API
 * View and manage student accounts
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
 * GET /api/management/students
 * Get all students (with filters)
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
    const search = searchParams.get('search');
    const propertyId = searchParams.get('propertyId');
    const nsfasBeneficiary = searchParams.get('nsfasBeneficiary');
    const accountStatus = searchParams.get('accountStatus');
    const universityName = searchParams.get('universityName');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    // Managers can only see students at their properties
    if (session.user.role === 'manager') {
      const managerProperties = await prisma.property.findMany({
        where: { managerId: session.user.id },
        select: { id: true },
      });
      where.propertyId = { in: managerProperties.map(p => p.id) };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (nsfasBeneficiary !== null) {
      where.nsfasBeneficiary = nsfasBeneficiary === 'true';
    }

    if (accountStatus) {
      where.accountStatus = accountStatus;
    }

    if (universityName) {
      where.universityName = { contains: universityName, mode: 'insensitive' };
    }

    // Fetch students
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { lastName: 'asc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          studentNumber: true,
          universityName: true,
          courseOfStudy: true,
          yearOfStudy: true,
          accountStatus: true,
          nsfasBeneficiary: true,
          nsfasReference: true,
          propertyId: true,
          property: {
            select: {
              name: true,
              address: true,
            },
          },
          createdAt: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'students',
      action: 'READ',
      metadata: { search, propertyId, count: students.length },
    });

    return NextResponse.json({
      students,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
