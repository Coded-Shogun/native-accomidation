/**
 * Dashboard Statistics API
 * Overview statistics for management dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess } from '@/lib/logger';

/**
 * GET /api/management/dashboard/stats
 * Get comprehensive dashboard statistics
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

    // Build property filter for managers
    let propertyFilter: any = {};
    if (session.user.role === 'PROPERTY_MANAGER') {
      const managerProperties = await prisma.property.findMany({
        where: { managerId: session.user.id },
        select: { id: true },
      });
      propertyFilter = { in: managerProperties.map(p => p.id) };
    }

    // Run all queries in parallel for performance
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [
      // Properties
      totalProperties,
      activeProperties,

      // Rooms and occupancy
      totalRooms,
      occupiedRooms,
      vacantRooms,

      // Students (student accommodation specific)
      totalStudents,
      activeStudents,
      nsfasStudents,

      // Leases
      activeLeases,
      expiringLeases,

      // Bursaries (student accommodation specific)
      activeBursaries,
      totalBursaryAmount,

      // Maintenance
      pendingMaintenanceRequests,
      urgentMaintenanceRequests,

      // Complaints
      openComplaints,
      criticalComplaints,

      // Recent activity
      recentMaintenanceRequests,
      recentComplaints,

      // Multi-sphere metrics
      activeBookings,
      paymentsTodayAggregate,
      sphereTypeGroups,
    ] = await Promise.all([
      // Properties stats
      prisma.property.count({
        where: session.user.role === 'PROPERTY_MANAGER' ? { id: propertyFilter } : {},
      }),
      prisma.property.count({
        where: {
          isActive: true,
          ...(session.user.role === 'PROPERTY_MANAGER' ? { id: propertyFilter } : {}),
        },
      }),

      // Rooms stats
      prisma.room.count({
        where: session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {},
      }),
      prisma.room.count({
        where: {
          occupancyStatus: 'occupied',
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),
      prisma.room.count({
        where: {
          occupancyStatus: 'vacant',
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),

      // Students stats
      prisma.studentProfile.count({
        where: session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {},
      }),
      prisma.studentProfile.count({
        where: {
          accountStatus: 'active',
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),
      prisma.studentProfile.count({
        where: {
          nsfasBeneficiary: true,
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),

      // Leases stats
      prisma.lease.count({
        where: {
          leaseStatus: 'active',
          ...(session.user.role === 'PROPERTY_MANAGER' ? {
            room: { propertyId: propertyFilter },
          } : {}),
        },
      }),
      prisma.lease.count({
        where: {
          leaseStatus: 'active',
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          ...(session.user.role === 'PROPERTY_MANAGER' ? {
            room: { propertyId: propertyFilter },
          } : {}),
        },
      }),

      // Bursaries stats
      prisma.studentBursary.count({
        where: {
          status: 'active',
          ...(session.user.role === 'PROPERTY_MANAGER' ? {
            student: { propertyId: propertyFilter },
          } : {}),
        },
      }),
      prisma.studentBursary.aggregate({
        where: {
          status: 'active',
          ...(session.user.role === 'PROPERTY_MANAGER' ? {
            student: { propertyId: propertyFilter },
          } : {}),
        },
        _sum: { amount: true },
      }),

      // Maintenance stats
      prisma.maintenanceRequest.count({
        where: {
          status: { in: ['submitted', 'acknowledged'] },
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          urgency: { in: ['high', 'emergency'] },
          status: { notIn: ['completed', 'cancelled'] },
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),

      // Complaints stats
      prisma.complaint.count({
        where: {
          status: { in: ['submitted', 'under_review', 'investigating'] },
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),
      prisma.complaint.count({
        where: {
          severity: 'critical',
          status: { notIn: ['resolved', 'closed'] },
          ...(session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {}),
        },
      }),

      // Recent activity
      prisma.maintenanceRequest.findMany({
        where: session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {},
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          category: true,
          title: true,
          urgency: true,
          status: true,
          createdAt: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.complaint.findMany({
        where: session.user.role === 'PROPERTY_MANAGER' ? { propertyId: propertyFilter } : {},
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          category: true,
          subject: true,
          severity: true,
          status: true,
          createdAt: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      // Active bookings across all spheres
      prisma.booking.count({
        where: {
          status: {
            in: ['pending', 'confirmed', 'checked_in'],
          },
          ...(session.user.role === 'PROPERTY_MANAGER'
            ? { propertyId: propertyFilter }
            : {}),
        },
      }),

      // Revenue today (lease payments) for occupied properties
      prisma.payment.aggregate({
        where: {
          paymentStatus: 'completed',
          paymentDate: {
            gte: startOfToday,
            lt: endOfToday,
          },
          ...(session.user.role === 'PROPERTY_MANAGER'
            ? {
                lease: {
                  propertyId: propertyFilter,
                },
              }
            : {}),
        },
        _sum: { amount: true },
      }),

      // Property counts by sphere type for donut chart
      prisma.property.groupBy({
        by: ['sphereType'],
        _count: {
          _all: true,
        },
        where:
          session.user.role === 'PROPERTY_MANAGER'
            ? {
                id: propertyFilter,
              }
            : {},
      }),
    ]);

    // Calculate derived metrics
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const nsfasPercentage = totalStudents > 0 ? (nsfasStudents / totalStudents) * 100 : 0;

    const revenueToday = paymentsTodayAggregate._sum.amount || 0;

    const sphereBreakdown: Record<string, number> = {
      STUDENT_ACCOMMODATION: 0,
      GUEST_HOUSE: 0,
      HOTEL: 0,
    };

    for (const group of sphereTypeGroups) {
      sphereBreakdown[group.sphereType] = group._count._all;
    }

    const stats = {
      properties: {
        total: totalProperties,
        active: activeProperties,
      },
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        vacant: vacantRooms,
        occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        nsfasBeneficiaries: nsfasStudents,
        nsfasPercentage: Math.round(nsfasPercentage * 10) / 10,
      },
      leases: {
        active: activeLeases,
        expiringSoon: expiringLeases, // Next 30 days
      },
      bursaries: {
        active: activeBursaries,
        totalAmount: totalBursaryAmount._sum.amount || 0,
      },
      bookings: {
        active: activeBookings,
      },
      revenue: {
        today: revenueToday,
      },
      spheres: {
        STUDENT_ACCOMMODATION: sphereBreakdown.STUDENT_ACCOMMODATION,
        GUEST_HOUSE: sphereBreakdown.GUEST_HOUSE,
        HOTEL: sphereBreakdown.HOTEL,
      },
      maintenance: {
        pending: pendingMaintenanceRequests,
        urgent: urgentMaintenanceRequests,
      },
      complaints: {
        open: openComplaints,
        critical: criticalComplaints,
      },
      recentActivity: {
        maintenanceRequests: recentMaintenanceRequests,
        complaints: recentComplaints,
      },
    };

    logDataAccess({
      userId: session.user.id,
      resource: 'dashboard_stats',
      action: 'READ',
      metadata: {
        role: session.user.role,
        propertyCount: totalProperties,
      },
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
