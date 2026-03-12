/**
 * Front Desk Overview Page
 * Shows open chat threads for properties the manager oversees
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

async function getThreads() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/front-desk/threads?limit=50`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return { threads: [], total: 0 };
  }

  return response.json();
}

export default async function FrontDeskPage() {
  const { threads, total } = await getThreads();

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading="Front Desk"
          description={`Open conversations with guests and residents (${total} threads)`}
        />

        <Card>
          <CardContent className="p-0">
            {threads && threads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threads.map((thread: any) => (
                    <TableRow key={thread.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/management/front-desk/${thread.id}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>
                            {thread.user?.name || thread.user?.email || 'Guest'}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {thread.property?.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            thread.status === 'open' ? 'success' : 'secondary'
                          }
                          className="capitalize"
                        >
                          {thread.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {thread.lastMessageAt
                            ? new Date(
                                thread.lastMessageAt
                              ).toLocaleString()
                            : 'No messages yet'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No open threads</h3>
                <p className="text-sm text-muted-foreground">
                  Front desk conversations will appear here as guests start
                  chatting from the reception experience.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

