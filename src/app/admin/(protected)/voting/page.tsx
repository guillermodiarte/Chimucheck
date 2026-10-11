import { db } from "@/lib/prisma";
import { VotingContestListClient } from "@/components/admin/voting/VotingContestListClient";

export default async function AdminVotingPage() {
  const contests = await db.votingContest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true } },
      entries: {
        include: {
          _count: { select: { votes: true } },
        },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <VotingContestListClient initialContests={contests as any} />
    </div>
  );
}
