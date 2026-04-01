import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findCopieById, listCopieProgressEvents } from '@/lib/epreuves/repository';

const encoder = new TextEncoder();

function encodeProgressEvent(event: {
  id: string;
  copieId: string;
  stage: string;
  message: string;
  progress: number | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}): Uint8Array {
  return encoder.encode(
    `id: ${event.id}\nevent: progress\ndata: ${JSON.stringify({ type: 'progress', event })}\n\n`,
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ copieId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (errorResponse) return errorResponse;
  if (!auth) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { copieId } = await params;
  const copie = await findCopieById(copieId);
  if (!copie || copie.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Copie introuvable.' }, { status: 404 });
  }

  const url = new URL(request.url);
  const snapshotOnly = url.searchParams.get('once') === '1';
  const initialEvents = await listCopieProgressEvents(copieId);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let lastSeenId = initialEvents.at(-1)?.id ?? null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (pollTimer) clearInterval(pollTimer);
        controller.close();
      };

      initialEvents.forEach((event) => {
        controller.enqueue(encodeProgressEvent(event));
      });

      if (snapshotOnly) {
        close();
        return;
      }

      heartbeatTimer = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        }
      }, 15000);

      pollTimer = setInterval(() => {
        void (async () => {
          if (closed) return;
          const events = await listCopieProgressEvents(copieId);
          const startIndex = lastSeenId
            ? events.findIndex((event) => event.id === lastSeenId)
            : -1;
          const unseen = startIndex >= 0 ? events.slice(startIndex + 1) : events;
          unseen.forEach((event) => {
            controller.enqueue(encodeProgressEvent(event));
            lastSeenId = event.id;
          });
        })().catch(() => {
          close();
        });
      }, 1000);

      request.signal.addEventListener('abort', close, { once: true });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
