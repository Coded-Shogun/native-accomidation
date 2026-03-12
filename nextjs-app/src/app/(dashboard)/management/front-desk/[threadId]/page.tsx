/**
 * Front Desk Thread Detail Page
 * Read-only view of a single chat thread and its messages
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ThreadPageProps {
  params: {
    threadId: string;
  };
}

async function getThread(threadId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/management/front-desk/threads/${threadId}`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function FrontDeskThreadPage({
  params,
}: ThreadPageProps) {
  const thread = await getThread(params.threadId);

  if (!thread) {
    return (
      <DashboardLayout requiredRole="PROPERTY_MANAGER">
        <div className="space-y-6">
          <PageHeader
            heading="Front Desk Thread"
            description="Conversation not found or you do not have access."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="PROPERTY_MANAGER">
      <div className="space-y-6">
        <PageHeader
          heading={
            thread.user?.name || thread.user?.email || 'Front desk thread'
          }
          description={thread.property?.name || 'Guest conversation'}
        />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>Thread status</span>
                <Badge
                  variant={thread.status === 'open' ? 'success' : 'secondary'}
                  className="capitalize"
                >
                  {thread.status}
                </Badge>
              </div>
              {thread.lastMessageAt && (
                <span className="text-xs text-muted-foreground">
                  Last message {new Date(thread.lastMessageAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-3 rounded-md border bg-muted/40 p-4">
              {thread.messages && thread.messages.length > 0 ? (
                thread.messages.map((m: any) => (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {m.senderType === 'STAFF' ? 'Staff' : 'Guest'}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="rounded bg-background px-3 py-2 text-sm">
                      {m.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No messages in this thread yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

