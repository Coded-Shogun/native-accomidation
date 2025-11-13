/**
 * Student Bursaries Stats API
 * Get summary statistics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/management/student-bursaries/stats/summary
 * Get bursary summary statistics
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

    // Get counts by status
    const [
      totalBursaries,
      activeBursaries,
      suspendedBursaries,
      completedBursaries,
      totalStudents,
      totalProviders,
      totalAmount,
    ] = await Promise.all([
      prisma.studentBursary.count(),
      prisma.studentBursary.count({ where: { status: 'active' } }),
      prisma.studentBursary.count({ where: { status: 'suspended' } }),
      prisma.studentBursary.count({ where: { status: 'completed' } }),
      prisma.studentBursary.groupBy({
        by: ['studentId'],
        _count: true,
      }).then((results) => results.length),
      prisma.bursaryProvider.count({ where: { isActive: true } }),
      prisma.studentBursary.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['active', 'pending'] } },
      }).then((result) => result._sum.amount || 0),
    ]);

    const stats = {
      total_bursaries: totalBursaries,
      active_bursaries: activeBursaries,
      suspended_bursaries: suspendedBursaries,
      completed_bursaries: completedBursaries,
      total_students: totalStudents,
      total_providers: totalProviders,
      total_amount: totalAmount,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching bursary stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bursary statistics' },
      { status: 500 }
    );
  }
}
