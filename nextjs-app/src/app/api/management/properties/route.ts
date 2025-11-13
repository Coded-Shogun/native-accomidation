/**
 * Properties Management API
 * CRUD operations for accommodation properties
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const propertySchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  province: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(10),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyType: z.enum(['residence', 'apartment', 'house', 'shared', 'other']),
  totalCapacity: z.number().int().min(1),
  availableRooms: z.number().int().min(0),
  monthlyRent: z.number().min(0),
  amenities: z.array(z.string()).optional(),
  nsfasApproved: z.boolean(),
  nsfasRegistrationNumber: z.string().optional(),
  managerId: z.string().uuid().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  emergencyContact: z.string(),
  emergencyPhone: z.string(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  rules: z.string().max(5000).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/management/properties
 * Get all properties (with filters)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role authorization
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const nsfasApproved = searchParams.get('nsfasApproved');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    // Managers can only see their assigned properties
    if (session.user.role === 'manager') {
      where.managerId = session.user.id;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = city;
    }

    if (nsfasApproved !== null) {
      where.nsfasApproved = nsfasApproved === 'true';
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Fetch properties with aggregates
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
        include: {
          manager: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              rooms: true,
              students: true,
              leases: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'properties',
      action: 'READ',
      metadata: { search, city, count: properties.length },
    });

    return NextResponse.json({
      properties,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/management/properties
 * Create a new property
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create properties
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = propertySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if NSFAS approved but no registration number
    if (data.nsfasApproved && !data.nsfasRegistrationNumber) {
      return NextResponse.json(
        { error: 'NSFAS registration number required for approved properties' },
        { status: 400 }
      );
    }

    // Check if manager exists (if provided)
    if (data.managerId) {
      const manager = await prisma.manager.findUnique({
        where: { id: data.managerId },
      });

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found' },
          { status: 404 }
        );
      }
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        ...data,
        availableRooms: data.totalCapacity, // Initially all rooms available
        isActive: data.isActive ?? true,
      },
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'property',
      resourceId: property.id,
      success: true,
      metadata: {
        propertyName: property.name,
        nsfasApproved: property.nsfasApproved,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'property',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
