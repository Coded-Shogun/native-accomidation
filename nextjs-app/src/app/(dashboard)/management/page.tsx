/**
 * Management Dashboard Page
 * Overview statistics and recent activity
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  DoorOpen,
  DollarSign,
  Wrench,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

async function getDashboardStats() {
  // In production, this would fetch from the API
  // For now, returning mock data
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/dashboard/stats`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function ManagementDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: 'Total Properties',
      value: stats?.properties.total || 0,
      icon: Building2,
      description: `${stats?.properties.active || 0} active`,
      trend: '+2 this month',
      color: 'text-blue-600',
    },
    {
      title: 'Total Students',
      value: stats?.students.total || 0,
      icon: Users,
      description: `${stats?.students.nsfasBeneficiaries || 0} NSFAS`,
      trend: `${stats?.students.nsfasPercentage || 0}% funded`,
      color: 'text-green-600',
    },
    {
      title: 'Room Occupancy',
      value: `${stats?.rooms.occupancyRate || 0}%`,
      icon: DoorOpen,
      description: `${stats?.rooms.occupied || 0}/${stats?.rooms.total || 0} rooms`,
      trend: `${stats?.rooms.vacant || 0} vacant`,
      color: 'text-purple-600',
    },
    {
      title: 'Active Bursaries',
      value: stats?.bursaries.active || 0,
      icon: DollarSign,
      description: `R${((stats?.bursaries.totalAmount || 0) / 1000).toFixed(0)}k total`,
      trend: 'R45k NSFAS cap',
      color: 'text-nsfas-green',
    },
  ];

  const alertCards = [
    {
      title: 'Pending Maintenance',
      value: stats?.maintenance.pending || 0,
      icon: Wrench,
      urgent: stats?.maintenance.urgent || 0,
      color: 'text-orange-600',
    },
    {
      title: 'Open Complaints',
      value: stats?.complaints.open || 0,
      icon: MessageSquare,
      urgent: stats?.complaints.critical || 0,
      color: 'text-red-600',
    },
    {
      title: 'Expiring Leases',
      value: stats?.leases.expiringSoon || 0,
      icon: AlertTriangle,
      urgent: 0,
      color: 'text-yellow-600',
    },
  ];

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        <PageHeader
          heading="Management Dashboard"
          description="Overview of all properties and students"
        />

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <p className="mt-1 flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Alerts Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {alertCards.map((alert) => {
            const Icon = alert.icon;
            return (
              <Card key={alert.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {alert.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${alert.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{alert.value}</div>
                  {alert.urgent > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      {alert.urgent} urgent
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Maintenance Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity?.maintenanceRequests?.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{request.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.student.firstName} {request.student.lastName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        request.urgency === 'emergency'
                          ? 'destructive'
                          : request.urgency === 'high'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {request.urgency}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">
                    No recent maintenance requests
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Complaints */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity?.complaints?.map((complaint: any) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{complaint.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {complaint.student.firstName} {complaint.student.lastName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        complaint.severity === 'critical'
                          ? 'destructive'
                          : complaint.severity === 'high'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {complaint.severity}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">
                    No recent complaints
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
