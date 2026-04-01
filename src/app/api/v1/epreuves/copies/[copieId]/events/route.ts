import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findCopieById, listCopieProgressEvents } from '@/lib/epreuves/repository';
import { checkRateLimit } from '@/lib/security/rate-limit';

const encoder = new TextEncoder();
const SSE_TIMEOUT_MS = 120_000;
const HEARTBEAT_MS = 15_000;
const POLL_MS = 1_000;
const TERMINAL_STAGES = new Set(['report_ready', 'failed']);

export const maxDuration = 120;

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

  const rateLimit = await checkRateLimit({
    request,
    key: `sse:${auth.user.id}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Trop de connexions actives.', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    );
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
      let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const close = () => {
        if (closed) return;
        closed = true;
        if (timeoutTimer) clearTimeout(timeoutTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (pollTimer) clearInterval(pollTimer);
        controller.close();
      };

      const resetTimeout = () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        timeoutTimer = setTimeout(() => {
          if (closed) return;
          controller.enqueue(encoder.encode('event: timeout\ndata: {}\n\n'));
          close();
        }, SSE_TIMEOUT_MS);
      };

      const pushEvent = (event: {
        id: string;
        copieId: string;
        stage: string;
        message: string;
        progress: number | null;
        payload: Record<string, unknown> | null;
        createdAt: string;
      }) => {
        if (closed) return;
        controller.enqueue(encodeProgressEvent(event));
        lastSeenId = event.id;
        resetTimeout();
        if (TERMINAL_STAGES.has(event.stage)) {
          close();
        }
      };

      resetTimeout();

      initialEvents.forEach((event) => {
        pushEvent(event);
      });

      if (snapshotOnly) {
        close();
        return;
      }

      heartbeatTimer = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
          resetTimeout();
        }
      }, HEARTBEAT_MS);

      pollTimer = setInterval(() => {
        void (async () => {
          if (closed) return;
          const events = await listCopieProgressEvents(copieId);
          const startIndex = lastSeenId
            ? events.findIndex((event) => event.id === lastSeenId)
            : -1;
          const unseen = startIndex >= 0 ? events.slice(startIndex + 1) : events;
          unseen.forEach((event) => {
            pushEvent(event);
          });
        })().catch(() => {
          close();
        });
      }, POLL_MS);

      request.signal.addEventListener('abort', close, { once: true });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}
