import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ProfileForm } from "@/components/player/ProfileForm";

export default async function PublicPlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  // Redirect owner to their private dashboard profile
  if (session?.user?.id === id) {
    redirect("/player/dashboard/profile");
  }

  const player = await db.player.findUnique({
    where: { id },
    include: {
      stats: true,
      categoryStats: true,
      registrations: {
        include: { tournament: true },
        orderBy: { registeredAt: "desc" },
      },
    }
  });

  if (!player) {
    notFound();
  }

  const profileBannerSection = await db.siteSection.findUnique({
    where: { key: "player_profile_banner" },
  });
  
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const bannerUrl = (profileBannerSection?.content as any)?.imageUrl || null;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const backgroundUrl = (profileBannerSection?.content as any)?.backgroundUrl || null;

  return (
    <div className="min-h-screen pt-24 bg-zinc-950">
      <ProfileForm 
        player={player} 
        profileBannerImage={bannerUrl} 
        profileBackgroundImage={backgroundUrl} 
        isPublic={true} 
      />
    </div>
  );
}
