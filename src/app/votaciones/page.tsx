import { db } from "@/lib/prisma";
import { Sparkles, Vote } from "lucide-react";
import { PublicVotingList } from "@/components/voting/PublicVotingList";

export const metadata = {
  title: "Votaciones | ChimuCheck",
  description: "Votá por las mejores fotos de la comunidad ChimuCheck. Elegí tus imágenes favoritas en los concursos oficiales.",
};

async function getPublicContests() {
  const now = new Date();

  // Auto-sync status
  await db.votingContest.updateMany({
    where: { status: "DRAFT", startDate: { lte: now } },
    data: { status: "ACTIVE" },
  });
  await db.votingContest.updateMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    data: { status: "FINISHED" },
  });

  const [contests, homeSection] = await Promise.all([
    db.votingContest.findMany({
      where: { status: { in: ["ACTIVE", "FINISHED"] } },
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { entries: true } },
        entries: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { imageUrl: true },
        },
      },
    }),
    db.siteSection.findUnique({ where: { key: "home_section" } }),
  ]);

  const defaultLogoUrl =
    (homeSection?.content as any)?.logoUrl ||
    "/uploads/imagenes/logo-trasparente-1771101621599-1771772834629.webp";

  return { contests, defaultLogoUrl };
}

export default async function PublicVotacionesPage() {
  const { contests, defaultLogoUrl } = await getPublicContests();

  return (
    <div className="relative min-h-screen pt-28 md:pt-40 lg:pt-48 pb-16 px-4 md:px-8">
      {/* Background ambient */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-yellow-500/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-16 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Comunidad ChimuCheck
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_25px_rgba(255,215,0,0.3)]">
            Votaciones y{" "}
            <span className="text-secondary">Concursos</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg drop-shadow-md">
            Los seguidores de ChimuCheck mandan sus mejores fotos gamer por Instagram y la comunidad elige las ganadoras. ¡Tu voto cuenta!
          </p>

          {/* Info pills */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">
              📷 Fotos de la comunidad
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">
              ❤️ 1 voto por imagen
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">
              🏆 Podio con los 3 ganadores
            </span>
          </div>
        </div>

        {/* Contests list */}
        <PublicVotingList contests={contests as any} defaultLogoUrl={defaultLogoUrl} />
      </div>
    </div>
  );
}
