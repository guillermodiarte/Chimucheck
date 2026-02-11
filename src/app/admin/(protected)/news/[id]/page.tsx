import { db } from "@/lib/prisma";
import { NewsForm } from "@/components/admin/NewsForm";
import { notFound } from "next/navigation";

interface EditNewsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const resolvedParams = await params;
  const newsItem = await db.news.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!newsItem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Editar Noticia</h1>
        <p className="text-gray-400">Modifica los detalles de la noticia.</p>
      </div>

      <NewsForm initialData={newsItem} />
    </div>
  );
}
