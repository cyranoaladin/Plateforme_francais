import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { readFallbackStore } from '@/lib/db/fallback-store';

type DashboardStudent = {
  id: string;
  displayName: string;
  email: string;
  averageScore: number;
  lastActivity: string | null;
  nextMockExam: string | null;
};

type DashboardCopy = {
  copieId: string;
  studentName: string;
  epreuveType: string;
  note: number | null;
  status: string;
  createdAt: string;
  teacherComment?: string;
};

function toDay(date: Date | string): string {
  const source = date instanceof Date ? date : new Date(date);
  return source.toISOString().slice(0, 10);
}

function buildDistribution(notes: Array<number | null>) {
  const bins = [
    { label: '0-5', min: 0, max: 5, count: 0 },
    { label: '6-9', min: 6, max: 9, count: 0 },
    { label: '10-13', min: 10, max: 13, count: 0 },
    { label: '14-16', min: 14, max: 16, count: 0 },
    { label: '17-20', min: 17, max: 20, count: 0 },
  ];

  for (const note of notes) {
    if (typeof note !== 'number') continue;
    const target = bins.find((item) => note >= item.min && note <= item.max);
    if (target) {
      target.count += 1;
    }
  }

  return bins.map(({ label, count }) => ({ label, count }));
}

/**
 * @route GET /api/v1/enseignant/dashboard
 * @description Retourne les données agrégées du tableau de bord enseignant.
 */
export async function GET() {
  const { auth, errorResponse } = await requireUserRole('enseignant');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const classCode = auth.user.profile.classCode ?? null;
  if (!classCode) {
    return NextResponse.json(
      {
        classCode: null,
        students: [] as DashboardStudent[],
        distribution: [] as Array<{ label: string; count: number }>,
        copies: [] as DashboardCopy[],
      },
      { status: 200 },
    );
  }

  if (!(await isDatabaseAvailable())) {
    const store = await readFallbackStore();
    const students = store.users
      .filter((item) => (item.role ?? 'eleve') === 'eleve' && item.profile.classCode === classCode)
      .map((item) => {
        const events = store.events.filter((event) => event.userId === item.id);
        const evalScores = events
          .filter((event) => event.type === 'evaluation' && typeof event.payload?.score === 'number')
          .map((event) => Number(event.payload?.score ?? 0));
        const average = evalScores.length > 0
          ? Number((evalScores.reduce((sum, value) => sum + value, 0) / evalScores.length).toFixed(1))
          : 0;

        const lastActivity = events.length > 0
          ? events.map((event) => event.createdAt).sort((a, b) => b.localeCompare(a))[0] ?? null
          : null;

        return {
          id: item.id,
          displayName: item.profile.displayName,
          email: item.email,
          averageScore: average,
          lastActivity,
          nextMockExam: null,
        } satisfies DashboardStudent;
      });

    return NextResponse.json(
      {
        classCode,
        students,
        distribution: buildDistribution([]),
        copies: [] as DashboardCopy[],
      },
      { status: 200 },
    );
  }

  const students = await prisma.user.findMany({
    where: {
      role: 'eleve',
      profile: { classCode },
    },
    include: {
      profile: true,
      evaluations: true,
      memoryEvents: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      epreuves: {
        orderBy: { generatedAt: 'desc' },
        take: 1,
        include: {
          copies: {
            where: { status: 'done' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      },
      copies: {
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          epreuve: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const dashboardStudents: DashboardStudent[] = students.map((student) => {
    const evaluationScores = student.evaluations.map((item) => item.score);
    const avgScore = evaluationScores.length > 0
      ? Number((evaluationScores.reduce((sum, value) => sum + value, 0) / evaluationScores.length).toFixed(1))
      : 0;

    const latestEpreuve = student.epreuves[0] ?? null;
    return {
      id: student.id,
      displayName: student.profile?.displayName ?? 'Élève',
      email: student.email,
      averageScore: avgScore,
      lastActivity: student.memoryEvents[0]?.createdAt.toISOString() ?? null,
      nextMockExam: latestEpreuve ? toDay(latestEpreuve.generatedAt) : null,
    };
  });

  const dashboardCopies: DashboardCopy[] = students.flatMap((student) =>
    student.copies.map((copy) => {
      const correction = typeof copy.correction === 'object' && copy.correction ? copy.correction as Record<string, unknown> : null;
      const note = correction && typeof correction.note === 'number' ? correction.note : null;
      const teacherComment = correction && typeof correction.commentaireEnseignant === 'string'
        ? correction.commentaireEnseignant
        : undefined;

      return {
        copieId: copy.id,
        studentName: student.profile?.displayName ?? student.email,
        epreuveType: copy.epreuve.type,
        note,
        status: copy.status,
        createdAt: copy.createdAt.toISOString(),
        teacherComment,
      };
    }),
  );

  const distribution = buildDistribution(dashboardCopies.map((copy) => copy.note));

  return NextResponse.json(
    {
      classCode,
      students: dashboardStudents,
      distribution,
      copies: dashboardCopies,
    },
    { status: 200 },
  );
}
