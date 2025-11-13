/**
 * Bursary Providers API Route
 * Manages funding organizations (NSFAS, corporate sponsors, NGOs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Schema for creating/updating bursary provider
const providerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['government', 'corporate', 'ngo', 'university', 'private', 'other']),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  requirements: z.string().optional(), // JSON string
  reportingFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'semester', 'annual']).default('monthly'),
  reportTemplate: z.string().optional(), // JSON string
  isActive: z.boolean().default(true),
});

/**
 * GET /api/management/bursary-providers
 * List all bursary providers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization (admin or manager)
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');

    // Build query
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Fetch providers
    const providers = await prisma.bursaryProvider.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            studentBursaries: true,
            bursaryReports: true,
          },
        },
      },
    });

    // Audit log
    logDataAccess({
      userId: session.user.id,
      resource: 'bursary_providers',
      action: 'READ',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching bursary providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bursary providers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/management/bursary-providers
 * Create new bursary provider
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = providerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if provider with same name exists
    const existing = await prisma.bursaryProvider.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A provider with this name already exists' },
        { status: 409 }
      );
    }

    // Create provider
    const provider = await prisma.bursaryProvider.create({
      data: {
        name: data.name,
        type: data.type,
        contactPerson: data.contactPerson || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        requirements: data.requirements || null,
        reportingFrequency: data.reportingFrequency,
        reportTemplate: data.reportTemplate || null,
        isActive: data.isActive,
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'bursary_provider',
      resourceId: provider.id,
      success: true,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating bursary provider:', error);

    // Audit log failure
    const session = await auth();
    if (session?.user) {
      logAudit({
        userId: session.user.id,
        action: 'CREATE',
        resource: 'bursary_provider',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      { error: 'Failed to create bursary provider' },
      { status: 500 }
    );
  }
}
