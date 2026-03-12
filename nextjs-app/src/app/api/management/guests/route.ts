/**
 * Guests Management API
 * Unified guests/residents list across spheres
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess } from '@/lib/logger';

/**
 * GET /api/management/guests
 * List guests/residents with property and room info
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
    const search = searchParams.get('search');
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Base where: only person-facing roles
    const where: any = {
      role: { in: ['STUDENT', 'GUEST', 'RESIDENT'] },
    };

    // Restrict by manager's properties
    if (session.user.role === 'PROPERTY_MANAGER') {
      const managerProperties = await prisma.property.findMany({
        where: { managerId: session.user.id },
        select: { id: true },
      });
      const managedIds = managerProperties.map((p) => p.id);

      where.OR = [
        { propertyId: { in: managedIds } },
        {
          studentProfile: {
            is: {
              OR: [
                { propertyId: { in: managedIds } },
                {
                  leases: {
                    some: {
                      propertyId: { in: managedIds },
                    },
                  },
                },
              ],
            },
          },
        },
      ];
    }

    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          {
            studentProfile: {
              is: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { studentNumber: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }

    if (propertyId) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { propertyId },
          {
            studentProfile: {
              is: {
                OR: [
                  { propertyId },
                  {
                    leases: {
                      some: { propertyId },
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    }

    if (status) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { status },
          {
            studentProfile: {
              is: {
                accountStatus: status,
              },
            },
          },
        ],
      });
    }

    const [guests, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          propertyId: true,
          property: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          studentProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              accountStatus: true,
              propertyId: true,
              property: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
              leases: {
                where: { leaseStatus: 'active' },
                orderBy: { startDate: 'desc' },
                take: 1,
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                  room: {
                    select: {
                      roomNumber: true,
                      floor: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'guests',
      action: 'READ',
      metadata: { search, propertyId, status, count: guests.length },
    });

    return NextResponse.json({
      guests,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}

