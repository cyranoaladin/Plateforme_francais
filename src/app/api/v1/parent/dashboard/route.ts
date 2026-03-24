import { NextResponse } from 'next/server';
import { requireExactUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';

function buildWeakSignals(timeline: Awaited<ReturnType<typeof listMemoryEventsByUser>>) {
  return timeline
    .filter((event) => event.type === 'evaluation')
    .flatMap((event) => {
      const weak = event.payload?.weakSkills;
      return Array.isArray(weak) ? weak : [];
    })
    .reduce<Record<string, number>>((acc, skill) => {
      acc[skill] = (acc[skill] ?? 0) + 1;
      return acc;
    }, {});
}

export async function GET(request: Request) {
  const { auth, errorResponse } = await requireExactUserRole('parent');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const parentEmail = auth.user.email.trim().toLowerCase();
  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '200', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 200;

  const linkedStudents = await prisma.studentProfile.findMany({
    where: {
      parentEmail: {
        equals: parentEmail,
        mode: 'insensitive',
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (linkedStudents.length === 0) {
    return NextResponse.json(
      {
        profile: {
          displayName: auth.user.profile.displayName,
          onboardingCompleted: false,
        },
        timeline: [],
        weakSignals: {},
        linkedStudents: [],
        linkageStatus: 'unlinked',
      },
      { status: 200 },
    );
  }

  const primaryStudent = linkedStudents[0];
  const timeline = await listMemoryEventsByUser(primaryStudent.userId, limit);

  return NextResponse.json(
    {
      profile: {
        displayName: primaryStudent.displayName,
        onboardingCompleted: primaryStudent.onboardingCompleted,
        eafDate: primaryStudent.eafDate?.toISOString(),
        selectedOeuvres: primaryStudent.selectedOeuvres,
        oeuvreChoisieEntretien: primaryStudent.oeuvreChoisieEntretien,
      },
      timeline,
      weakSignals: buildWeakSignals(timeline),
      linkedStudents: linkedStudents.map((student) => ({
        id: student.userId,
        displayName: student.displayName,
        email: student.user.email,
        classLevel: student.classLevel,
      })),
      linkageStatus: 'linked',
    },
    { status: 200 },
  );
}
