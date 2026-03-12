'use client';

/**
 * Service Detail Page
 * Edit or delete an existing service item
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  isAvailable: boolean;
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/management/services/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load service');
        }
        const json = await response.json();
        setService(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load service item.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      load();
    }
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    if (!service) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: String(formData.get('name') || ''),
        description: String(formData.get('description') || ''),
        category: String(formData.get('category') || ''),
        price: Number(formData.get('price') || 0),
        isAvailable: formData.get('isAvailable') === 'on',
      };

      const response = await fetch(`/api/management/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update service');
      }

      router.push('/management/services');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update service item.'
      );
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    if (!confirm('Are you sure you want to delete this service?')) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/management/services/${service.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete service');
      }

      router.push('/management/services');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete service item.'
      );
      setSaving(false);
    }
  };

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading={service?.name || 'Service'}
          description="Update or remove this service item"
        />

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : service ? (
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
                    defaultValue={service.name}
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
                    defaultValue={service.description ?? ''}
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
                      defaultValue={service.category}
                      required
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
                      defaultValue={service.price}
                      required
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <input
                      id="isAvailable"
                      name="isAvailable"
                      type="checkbox"
                      defaultChecked={service.isAvailable}
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
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/management/services')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-destructive">
                Failed to load service or it does not exist.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

