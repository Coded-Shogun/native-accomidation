/**
 * Services Management Page
 * View and manage service catalog across properties
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

async function getServices() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/services?limit=100`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return { services: [], total: 0 };
  }

  return response.json();
}

export default async function ServicesPage() {
  const { services, total } = await getServices();

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="Services & Catalog"
          description={`Service catalog across properties (${total} items)`}
        >
          <Button asChild>
            <Link href="/management/services/new">
              Add Service
            </Link>
          </Button>
        </PageHeader>

        <Card>
          <CardContent className="p-0">
            {services && services.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span>{s.name}</span>
                            {s.description && (
                              <span className="text-xs text-muted-foreground">
                                {s.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.category}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {s.property?.name ?? 'All properties'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        R{(s.price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.isAvailable ? 'success' : 'secondary'}
                        >
                          {s.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/management/services/${s.id}`}>
                            Edit
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No services in catalog
                </h3>
                <p className="text-sm text-muted-foreground">
                  Services and products will appear here once they are added to
                  the catalog.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

