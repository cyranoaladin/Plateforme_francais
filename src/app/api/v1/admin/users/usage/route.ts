import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate usage metrics
    const [
      oralSessionsThisMonth,
      correctionsThisMonth,
      tutorQuestionsToday,
      llmTokensToday,
      ragSearchesToday,
    ] = await Promise.all([
      // Oral sessions this month
      prisma.oralSession.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Written corrections this month
      prisma.copieDeposee.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth,
          },
          status: 'done',
        },
      }),

      // Tutor questions today
      prisma.memoryEvent.count({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
          },
          type: 'question',
        },
      }),

      // LLM tokens today (mock - would need to be tracked)
      prisma.memoryEvent.count({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
          },
        },
      }),

      // RAG searches today
      prisma.memoryEvent.count({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
          },
          type: 'search',
        },
      }),
    ]);

    // Mock token calculation (would need actual tracking)
    const calculatedTokensToday = tutorQuestionsToday * 1500; // Average tokens per question

    return NextResponse.json({
      usage: {
        oralSessionsThisMonth,
        correctionsThisMonth,
        tutorQuestionsToday,
        llmTokensToday: calculatedTokensToday,
        ragSearchesToday: ragSearchesToday,
      },
    }, { status: 200 });

  } catch (error) {
    logger.error('Error fetching user usage:', error as Error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données d\'utilisation' },
      { status: 500 }
    );
  }
}
