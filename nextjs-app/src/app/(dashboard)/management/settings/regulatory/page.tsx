/**
 * Regulatory Settings Page
 * Manage regulatory bodies and view property compliance
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

async function getRegulatorySettings() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/settings/regulatory`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function RegulatorySettingsPage() {
  const data = await getRegulatorySettings();

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="Regulatory Settings"
          description="Configure regulatory bodies and track property compliance"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Bodies</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.bodies && data.bodies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sphere</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.bodies.map((body: any) => (
                      <TableRow key={body.id}>
                        <TableCell className="font-medium">
                          {body.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {body.sphereType
                            .toLowerCase()
                            .replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              body.isActive ? 'success' : 'secondary'
                            }
                          >
                            {body.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No regulatory bodies configured yet. Seed NSFAS, TGCSA and
                  SATSA to get started.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Compliance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.compliance && data.compliance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Body</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.compliance.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.property?.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.regulatoryBody?.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.status === 'compliant'
                                ? 'success'
                                : c.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="capitalize"
                          >
                            {c.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No regulatory compliance records yet. Link properties to
                  bodies to start tracking compliance.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

