import { db } from "@/lib/prisma";
import { BannerForm } from "@/components/admin/BannerForm";
import { notFound } from "next/navigation";

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const { id } = await params;
  const banner = await db.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Banner</h1>
        <p className="text-gray-400">Modifica los detalles del banner existente.</p>
      </div>
      <BannerForm initialData={banner} />
    </div>
  );
}
