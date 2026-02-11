import { BannerForm } from "@/components/admin/BannerForm";

export default function CreateBannerPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Banner</h1>
        <p className="text-gray-400">Añade una nueva imagen al carrusel principal.</p>
      </div>

      <BannerForm />
    </div>
  );
}
