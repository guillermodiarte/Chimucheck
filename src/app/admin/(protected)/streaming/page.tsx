import { getStreamingConfig } from "@/app/actions/streaming";
import StreamingForm from "@/components/admin/StreamingForm";

export default async function StreamingPage() {
  const data = await getStreamingConfig();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Streaming</h1>
      <p className="text-gray-400">Controla la visualización del stream en vivo en la página principal.</p>

      <div className="max-w-4xl">
        <StreamingForm initialData={data} />
      </div>
    </div>
  );
}
