/**
 * POS Reports Page
 * Basic revenue overview using Payments and KioskOrders
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

async function getPosReports() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/pos-reports`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function PosReportsPage() {
  const data = await getPosReports();

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="POS & Revenue Reports"
          description="Overview of service orders and lease payments"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Lease Revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span className="text-2xl font-bold">
                  R{(data?.leaseRevenue?.total || 0).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Across all completed lease payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Service Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">
                {data?.serviceOrders?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed kiosk/service orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Order Revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline gap-2">
                <DollarSign className="h-5 w-5 text-sky-600" />
                <span className="text-2xl font-bold">
                  R{(data?.serviceOrders?.totalAmount || 0).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sum of all kiosk/service order totals
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

