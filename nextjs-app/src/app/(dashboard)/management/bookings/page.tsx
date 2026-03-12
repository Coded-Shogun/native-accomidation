/**
 * Bookings Management Page
 * View upcoming bookings across properties
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, Building2, DoorOpen } from 'lucide-react';

async function getBookings() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/bookings?upcoming=true&limit=50`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return { bookings: [], total: 0 };
  }

  return response.json();
}

export default async function BookingsPage() {
  const { bookings, total } = await getBookings();

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="Bookings"
          description={`Upcoming bookings across properties (${total} total)`}
        />

        <Card>
          <CardContent className="p-0">
            {bookings && bookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.user?.name || b.user?.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {b.property?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.room ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DoorOpen className="h-3 w-3" />
                            Room {b.room.roomNumber} · Floor {b.room.floor}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(b.startsAt).toLocaleDateString()} –{' '}
                          {new Date(b.endsAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === 'confirmed' || b.status === 'checked_in'
                              ? 'success'
                              : b.status === 'cancelled'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="capitalize"
                        >
                          {b.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No upcoming bookings</h3>
                <p className="text-sm text-muted-foreground">
                  New reservations will appear here once they are created.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

