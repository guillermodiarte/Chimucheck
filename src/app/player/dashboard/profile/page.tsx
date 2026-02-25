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
      registrations: {
        include: { tournament: true },
        orderBy: { registeredAt: "desc" },
      },
    }
  });

  if (!player) redirect("/player/login");

  return <ProfileForm player={player} />;
}
