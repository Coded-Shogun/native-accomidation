'use client';

/**
 * New Service Page
 * Create a new service item in the catalog
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewServicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: String(formData.get('name') || ''),
        description: String(formData.get('description') || ''),
        category: String(formData.get('category') || ''),
        price: Number(formData.get('price') || 0),
        isAvailable: formData.get('isAvailable') === 'on',
      };

      const response = await fetch('/api/management/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create service');
      }

      router.push('/management/services');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create service item.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="Add Service"
          description="Create a new service or product in the catalog"
        />

        <Card>
          <CardContent className="pt-6">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit(new FormData(event.currentTarget));
              }}
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-foreground"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-foreground"
                  >
                    Category
                  </label>
                  <input
                    id="category"
                    name="category"
                    required
                    placeholder="room_service, laundry, kiosk"
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-foreground"
                  >
                    Price (ZAR)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <input
                    id="isAvailable"
                    name="isAvailable"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                  />
                  <label
                    htmlFor="isAvailable"
                    className="text-sm text-foreground"
                  >
                    Available
                  </label>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Service'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/management/services')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

