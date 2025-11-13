/**
 * Student Maintenance Requests Page
 * View and submit maintenance requests
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Wrench, AlertCircle } from 'lucide-react';
import Link from 'next/link';

async function getMaintenanceRequests() {
  // In production, this would fetch from the API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/student/maintenance-requests`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return { requests: [], total: 0 };
  }

  return response.json();
}

function getUrgencyVariant(urgency: string) {
  switch (urgency) {
    case 'emergency':
      return 'destructive';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    default:
      return 'secondary';
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'cancelled':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default async function MaintenancePage() {
  const { requests, total } = await getMaintenanceRequests();

  const pendingRequests = requests?.filter(
    (r: any) => !['completed', 'cancelled'].includes(r.status)
  );

  return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          heading="Maintenance Requests"
          description="Submit and track maintenance issues"
        >
          <Button asChild>
            <Link href="/student/maintenance/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        </PageHeader>

        {/* Help Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            For emergencies (water leaks, electrical faults, security issues), please
            also contact the property manager immediately at the emergency number
            provided.
          </AlertDescription>
        </Alert>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingRequests?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests?.filter((r: any) => r.status === 'completed').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests && requests.length > 0 ? (
            requests.map((request: any) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{request.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.category.replace('_', ' ').toUpperCase()} •{' '}
                        {request.location}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant={getUrgencyVariant(request.urgency)}>
                        {request.urgency}
                      </Badge>
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{request.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                    {request.assignedTo && (
                      <span>
                        Assigned to: {request.assignedTo.firstName}{' '}
                        {request.assignedTo.lastName}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No maintenance requests
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't submitted any maintenance requests yet
                </p>
                <Button asChild>
                  <Link href="/student/maintenance/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Request
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
