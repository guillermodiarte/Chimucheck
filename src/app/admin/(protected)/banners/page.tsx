import { db } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { BannersManager } from "@/components/admin/BannersManager";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await db.banner.findMany({
    orderBy: { order: "asc" },
  });

  const topPlayersSection = await db.siteSection.findUnique({
    where: { key: "banner_top_players" },
  });
  const topContent = (topPlayersSection?.content as any) || {};
  const isTopPlayersEnabled = topContent.enabled ?? true;
  const topPlayersOrder = typeof topContent.order === "number" ? topContent.order : 2;

  const bannerSettingsSection = await db.siteSection.findUnique({
    where: { key: "banner_settings" },
  });
  const bannerSettings = (bannerSettingsSection?.content as any) || {};
  const bannerInterval = typeof bannerSettings.interval === "number" ? bannerSettings.interval : 5;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-gray-400">
            Gestiona las imágenes y el orden del carrusel principal.
          </p>
        </div>
        <Link href="/admin/banners/create">
          <Button className="bg-secondary text-black hover:bg-yellow-400 gap-2">
            <Plus className="w-4 h-4" /> Nuevo Banner
          </Button>
        </Link>
      </div>

      <BannersManager
        initialBanners={banners}
        initialTopPlayersEnabled={isTopPlayersEnabled}
        initialTopPlayersOrder={topPlayersOrder}
        initialInterval={bannerInterval}
      />
    </div>
  );
}
