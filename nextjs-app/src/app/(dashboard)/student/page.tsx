/**
 * Student Dashboard Page
 * Personal overview for student portal
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  DollarSign,
  Wrench,
  Package,
  Bell,
  Calendar,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

async function getStudentData() {
  // In production, this would fetch from the API
  // For now, returning mock data structure
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/student/accommodation`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function StudentDashboardPage() {
  const data = await getStudentData();

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          heading="My Dashboard"
          description="Welcome back to your student portal"
        />

        {/* Accommodation Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Property Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-nsfas-green" />
                My Accommodation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.property ? (
                <>
                  <div>
                    <h3 className="font-semibold">{data.property.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {data.property.address}, {data.property.city}
                    </p>
                  </div>

                  {data.lease && (
                    <div className="rounded-lg border p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Room:</span>
                        <span className="font-medium">
                          {data.lease.room.roomNumber} (Floor {data.lease.room.floor})
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lease Status:</span>
                        <Badge variant="success">{data.lease.leaseStatus}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Rent:</span>
                        <span className="font-medium">
                          R{data.lease.monthlyRent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lease End:</span>
                        <span className="font-medium">
                          {new Date(data.lease.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button asChild className="w-full">
                    <Link href="/student/accommodation">View Details</Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No accommodation assigned yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bursary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-nsfas-green" />
                My Bursaries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.bursaries && data.bursaries.length > 0 ? (
                <>
                  {data.bursaries.map((bursary: any) => (
                    <div key={bursary.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{bursary.provider.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {bursary.provider.type}
                          </p>
                        </div>
                        <Badge variant="success">{bursary.status}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">
                          R{bursary.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Academic Year:</span>
                        <span className="font-medium">{bursary.academicYear}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No active bursaries
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/student/maintenance">
                  <Wrench className="h-5 w-5" />
                  <span>Maintenance Request</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/student/laundry">
                  <Calendar className="h-5 w-5" />
                  <span>Book Laundry</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/student/deliveries">
                  <Package className="h-5 w-5" />
                  <span>Check Deliveries</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/student/notices">
                  <Bell className="h-5 w-5" />
                  <span>View Notices</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recent maintenance requests
              </p>
              <Button asChild variant="link" className="mt-2 p-0">
                <Link href="/student/maintenance">View all requests</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No upcoming laundry bookings
              </p>
              <Button asChild variant="link" className="mt-2 p-0">
                <Link href="/student/laundry">Book a slot</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
