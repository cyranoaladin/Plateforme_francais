import { type Prisma } from '@prisma/client';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';

export async function createEvaluation(input: {
  userId: string;
  kind: string;
  score: number;
  maxScore: number;
  status: string;
  payload?: Prisma.InputJsonValue;
}) {
  if (!(await isDatabaseAvailable())) {
    return;
  }

  await prisma.evaluation.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      score: input.score,
      maxScore: input.maxScore,
      status: input.status,
      payload: input.payload,
    },
  });
}
