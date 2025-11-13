/**
 * Student Notices API
 * Get notices for student's property
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess } from '@/lib/logger';

/**
 * GET /api/student/notices
 * Get notices for student's property
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student's property
    const student = await prisma.student.findUnique({
      where: { id: session.user.id },
      select: { propertyId: true },
    });

    if (!student?.propertyId) {
      return NextResponse.json({ error: 'No property assigned' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build where clause
    const where: any = {
      propertyId: student.propertyId,
      isActive: true,
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ],
    };

    if (category) {
      where.category = category;
    }

    // Fetch notices
    const notices = await prisma.notice.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { publishDate: 'desc' },
      ],
      take: 50, // Limit to last 50 notices
    });

    logDataAccess({
      userId: session.user.id,
      resource: 'notices',
      action: 'READ',
      metadata: { propertyId: student.propertyId, category },
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}
