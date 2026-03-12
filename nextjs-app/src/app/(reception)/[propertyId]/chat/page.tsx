import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { FrontDeskChatWidget } from '@/components/reception/FrontDeskChatWidget';

interface ChatPageProps {
  params: { propertyId: string };
}

export default async function ReceptionChatPage({ params }: ChatPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/reception/${params.propertyId}/chat`);
  }

  // Find or create a chat thread for this user + property
  const thread = await prisma.chatThread.upsert({
    where: {
      // Composite uniqueness emulated via unique index in real migration;
      // for now use single id fallback when not found.
      id: `${params.propertyId}_${session.user.id}`,
    },
    update: {},
    create: {
      id: `${params.propertyId}_${session.user.id}`,
      propertyId: params.propertyId,
      userId: session.user.id,
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Front desk chat</h1>
      <FrontDeskChatWidget threadId={thread.id} />
    </div>
  );
}

