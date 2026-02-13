import { MediaGallery } from "@/components/admin/MediaGallery";
import { getMediaFiles } from "@/app/actions/media";

export default async function MediaPage() {
  const files = await getMediaFiles();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Biblioteca de Medios</h1>
          <p className="text-gray-400">
            Gestiona todas las imágenes y archivos subidos al servidor.
          </p>
        </div>
      </div>

      <MediaGallery initialFiles={files} />
    </div>
  );
}
