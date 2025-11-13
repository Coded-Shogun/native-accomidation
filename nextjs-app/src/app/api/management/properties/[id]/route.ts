/**
 * Property Detail Management API
 * Get, update, and delete specific property
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for updates
const propertyUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  address: z.string().min(5).max(500).optional(),
  city: z.string().min(2).max(100).optional(),
  province: z.string().min(2).max(100).optional(),
  postalCode: z.string().min(4).max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyType: z.enum(['residence', 'apartment', 'house', 'shared', 'other']).optional(),
  totalCapacity: z.number().int().min(1).optional(),
  monthlyRent: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  nsfasApproved: z.boolean().optional(),
  nsfasRegistrationNumber: z.string().optional(),
  managerId: z.string().uuid().nullable().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  rules: z.string().max(5000).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/management/properties/:id
 * Get property details
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

    const propertyId = params.id;

    // Fetch property with details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            students: true,
            leases: true,
            maintenanceRequests: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Managers can only access their assigned properties
    if (session.user.role === 'manager' && property.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get occupancy stats
    const occupancyStats = await prisma.room.groupBy({
      by: ['occupancyStatus'],
      where: { propertyId },
      _count: true,
    });

    logDataAccess({
      userId: session.user.id,
      resource: 'property',
      action: 'READ',
      resourceId: propertyId,
    });

    return NextResponse.json({
      ...property,
      occupancyStats: occupancyStats.reduce((acc, stat) => {
        acc[stat.occupancyStatus] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/management/properties/:id
 * Update property
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

    const propertyId = params.id;
    const body = await request.json();

    // Validate input
    const validation = propertyUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Managers can only update their assigned properties
    if (session.user.role === 'manager' && existingProperty.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check NSFAS approval consistency
    if (data.nsfasApproved && !data.nsfasRegistrationNumber && !existingProperty.nsfasRegistrationNumber) {
      return NextResponse.json(
        { error: 'NSFAS registration number required for approved properties' },
        { status: 400 }
      );
    }

    // Check if manager exists (if changing)
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

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data,
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
      action: 'UPDATE',
      resource: 'property',
      resourceId: propertyId,
      success: true,
      metadata: {
        changes: Object.keys(data),
      },
    });

    return NextResponse.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'UPDATE',
      resource: 'property',
      resourceId: params.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/management/properties/:id
 * Delete property (soft delete - deactivate)
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

    // Only admins can delete properties
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const propertyId = params.id;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        _count: {
          select: {
            students: true,
            leases: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Check if property has active students or leases
    if (property._count.students > 0 || property._count.leases > 0) {
      return NextResponse.json(
        { error: 'Cannot delete property with active students or leases. Deactivate instead.' },
        { status: 400 }
      );
    }

    // Soft delete - deactivate property
    const deactivatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: { isActive: false },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'property',
      resourceId: propertyId,
      success: true,
      metadata: {
        propertyName: property.name,
        method: 'soft_delete',
      },
    });

    return NextResponse.json({
      message: 'Property deactivated successfully',
      property: deactivatedProperty,
    });
  } catch (error) {
    console.error('Error deleting property:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'DELETE',
      resource: 'property',
      resourceId: params.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
