import { NewsForm } from "@/components/admin/NewsForm";

export default function CreateNewsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Noticia</h1>
        <p className="text-gray-400">Crea una nueva publicación para la sección de novedades.</p>
      </div>

      <NewsForm />
    </div>
  );
}
