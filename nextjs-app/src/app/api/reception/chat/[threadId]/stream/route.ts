import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const threadId = params.threadId;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      async function sendSnapshot() {
        const messages = await prisma.chatMessage.findMany({
          where: { threadId },
          orderBy: { createdAt: 'asc' },
          take: 50,
        });

        const payload = JSON.stringify({
          type: 'snapshot',
          messages,
        });

        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }

      await sendSnapshot();

      let active = true;
      async function poll() {
        if (!active) return;
        await sendSnapshot();
        setTimeout(poll, 3000);
      }

      poll();

      controller.enqueue(encoder.encode(':ok\n\n'));

      return () => {
        active = false;
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

