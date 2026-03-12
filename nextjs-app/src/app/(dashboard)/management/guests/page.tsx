/**
 * Guests Management Page
 * Unified guests/residents list
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
import { Users, Building2 } from 'lucide-react';

async function getGuests() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/guests?limit=50`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return { guests: [], total: 0 };
  }

  return response.json();
}

export default async function GuestsPage() {
  const { guests, total } = await getGuests();

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="Guests & Residents"
          description={`Active guests and residents (${total} total)`}
        />

        <Card>
          <CardContent className="p-0">
            {guests && guests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest: any) => {
                    const profile = guest.studentProfile;
                    const activeLease =
                      profile?.leases && profile.leases.length > 0
                        ? profile.leases[0]
                        : null;

                    const displayName =
                      profile?.firstName && profile?.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : guest.name || guest.email;

                    const property =
                      profile?.property || guest.property || null;

                    const status =
                      profile?.accountStatus || guest.status || 'active';

                    return (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span>{displayName}</span>
                              {profile?.studentNumber && (
                                <span className="text-xs text-muted-foreground">
                                  #{profile.studentNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-xs">
                          {guest.role.toLowerCase().replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {property ? property.name : 'Unassigned'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {activeLease ? (
                            <span className="text-sm">
                              Room {activeLease.room.roomNumber} · Floor{' '}
                              {activeLease.room.floor}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No active room
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === 'active'
                                ? 'success'
                                : status === 'suspended'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs text-muted-foreground">
                            <span>{guest.email}</span>
                            {guest.phone && <span>{guest.phone}</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No guests or residents found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Guests and residents will appear here once they are added and
                  assigned to properties.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

