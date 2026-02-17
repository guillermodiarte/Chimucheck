import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import { ProfileForm } from "@/components/player/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/player/login");

  const player = await db.player.findUnique({
    where: { id: session.user.id }
  });

  if (!player) redirect("/player/login");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
          Mi Cuenta
        </h1>
      </div>

      <Card className="bg-zinc-900 border-white/10">
        <CardHeader>
          <CardTitle>Información del Perfil</CardTitle>
          <CardDescription>
            Actualiza tu información personal y configuración de cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mb-4">
              {player.image ? (
                <Image
                  src={player.image}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-4xl text-gray-500 font-bold">
                  {player.alias?.[0]?.toUpperCase() || "J"}
                </div>
              )}
            </div>
          </div>

          <ProfileForm player={player} />
        </CardContent>
      </Card>
    </div>
  );
}
