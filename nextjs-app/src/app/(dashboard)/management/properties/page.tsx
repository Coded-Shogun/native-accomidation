/**
 * Properties Management Page
 * List and manage accommodation properties
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
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
import { Plus, MapPin, Users, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

async function getProperties() {
  // In production, this would fetch from the API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/properties?limit=50`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return { properties: [], total: 0 };
  }

  return response.json();
}

export default async function PropertiesPage() {
  const { properties, total } = await getProperties();

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="Properties"
          description={`Manage accommodation properties (${total} total)`}
        >
          <Button asChild>
            <Link href="/management/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </PageHeader>

        <Card>
          <CardContent className="p-0">
            {properties && properties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sphere</TableHead>
                    <TableHead>Regulator</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>NSFAS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property: any) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">
                        {property.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {property.city}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {property.sphereType?.replace('_', ' ').toLowerCase() || 'n/a'}
                      </TableCell>
                      <TableCell>
                        {property.regulatoryBody?.name ? (
                          <span className="text-sm text-muted-foreground">
                            {property.regulatoryBody.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {property.totalCapacity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {property._count?.students || 0} /{' '}
                          {property.totalCapacity}
                          <div className="mt-1 h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-nsfas-green"
                              style={{
                                width: `${
                                  ((property._count?.students || 0) /
                                    property.totalCapacity) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {property.nsfasApproved ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Not Approved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {property.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/management/properties/${property.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No properties found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating your first property
                </p>
                <Button asChild>
                  <Link href="/management/properties/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
