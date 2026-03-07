import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/player/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/player/login");

  const player = await db.player.findUnique({
    where: { id: session.user.id },
    include: {
      stats: true,
      categoryStats: true,
      registrations: {
        include: { tournament: true },
        orderBy: { registeredAt: "desc" },
      },
    }
  });

  if (!player) redirect("/player/login");

  const profileBannerSection = await db.siteSection.findUnique({
    where: { key: "player_profile_banner" },
  });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const bannerUrl = (profileBannerSection?.content as any)?.imageUrl || null;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const backgroundUrl = (profileBannerSection?.content as any)?.backgroundUrl || null;

  return <ProfileForm player={player} profileBannerImage={bannerUrl} profileBackgroundImage={backgroundUrl} />;
}
