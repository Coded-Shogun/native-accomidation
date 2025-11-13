/**
 * Bursary Provider Detail API Route
 * Get, update, or delete specific bursary provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

const providerSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(['government', 'corporate', 'ngo', 'university', 'private', 'other']).optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  requirements: z.string().optional(),
  reportingFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'semester', 'annual']).optional(),
  reportTemplate: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/management/bursary-providers/[id]
 * Get bursary provider details
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

    const provider = await prisma.bursaryProvider.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            studentBursaries: true,
            bursaryReports: true,
            requirements_rel: true,
          },
        },
        requirements_rel: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    logDataAccess({
      userId: session.user.id,
      resource: 'bursary_provider',
      action: 'READ',
      resourceId: provider.id,
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching bursary provider:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bursary provider' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/management/bursary-providers/[id]
 * Update bursary provider
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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = providerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if provider exists
    const existing = await prisma.bursaryProvider.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Check name uniqueness if changing name
    if (validation.data.name && validation.data.name !== existing.name) {
      const duplicate = await prisma.bursaryProvider.findUnique({
        where: { name: validation.data.name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A provider with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update provider
    const provider = await prisma.bursaryProvider.update({
      where: { id: params.id },
      data: validation.data,
    });

    logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'bursary_provider',
      resourceId: provider.id,
      changes: JSON.stringify(validation.data),
      success: true,
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error updating bursary provider:', error);
    return NextResponse.json(
      { error: 'Failed to update bursary provider' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/management/bursary-providers/[id]
 * Delete bursary provider
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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if provider exists
    const provider = await prisma.bursaryProvider.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { studentBursaries: true },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Check if provider has active bursaries
    if (provider._count.studentBursaries > 0) {
      return NextResponse.json(
        { error: 'Cannot delete provider with active bursaries. Deactivate instead.' },
        { status: 400 }
      );
    }

    // Delete provider
    await prisma.bursaryProvider.delete({
      where: { id: params.id },
    });

    logAudit({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'bursary_provider',
      resourceId: params.id,
      success: true,
    });

    return NextResponse.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting bursary provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete bursary provider' },
      { status: 500 }
    );
  }
}
