import { BannerForm } from "@/components/admin/BannerForm";

import { db } from "@/lib/prisma";

export default async function CreateBannerPage() {
  const lastBanner = await db.banner.findFirst({
    orderBy: { order: "desc" },
  });

  const nextOrder = (lastBanner?.order ?? -1) + 1;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Banner</h1>
        <p className="text-gray-400">Añade una nueva imagen al carrusel principal.</p>
      </div>

      <BannerForm defaultOrder={nextOrder} />
    </div>
  );
}
