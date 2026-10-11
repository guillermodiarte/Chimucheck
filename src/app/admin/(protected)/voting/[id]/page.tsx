import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { VotingContestForm } from "@/components/admin/voting/VotingContestForm";
import { VotingEntriesManager } from "@/components/admin/voting/VotingEntriesManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminVotingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const contest = await db.votingContest.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });

  if (!contest) notFound();

  const serialized = {
    ...contest,
    startDate: contest.startDate.toISOString(),
    endDate: contest.endDate.toISOString(),
    createdAt: contest.createdAt.toISOString(),
    updatedAt: contest.updatedAt.toISOString(),
    entries: contest.entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Edit contest metadata */}
      <VotingContestForm initialData={serialized} />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Image entries manager */}
      <VotingEntriesManager
        contestId={id}
        contestStatus={contest.status}
        initialEntries={serialized.entries as any}
      />
    </div>
  );
}
