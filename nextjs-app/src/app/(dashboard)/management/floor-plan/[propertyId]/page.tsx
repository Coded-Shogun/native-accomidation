/**
 * Floor Plan Management Page
 * For now, read-only view of stored floorPlanData JSON per property
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

interface FloorPlanPageProps {
  params: {
    propertyId: string;
  };
}

async function getProperty(propertyId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/properties/${propertyId}`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function FloorPlanPage({ params }: FloorPlanPageProps) {
  const property = await getProperty(params.propertyId);

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading={property?.name || 'Floor Plan'}
          description="Floor plan configuration for this property"
        />

        <Card>
          <CardContent className="space-y-4 pt-6">
            {property?.floorPlanData ? (
              <pre className="max-h-[480px] overflow-auto rounded bg-muted p-4 text-xs">
                {JSON.stringify(property.floorPlanData, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                No floor plan data configured yet. In a future phase this will
                support a drag-and-drop editor for navigation nodes and edges.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

