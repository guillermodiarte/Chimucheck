import { getSocialLinks } from "@/app/actions/socials";
import SocialsForm from "@/components/admin/SocialsForm";

export default async function SocialsPage() {
  const data = await getSocialLinks();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Redes Sociales</h1>
      <p className="text-gray-400">Actualiza los enlaces que aparecen en el Navbar y Footer.</p>

      <div className="max-w-4xl">
        <SocialsForm initialData={data} />
      </div>
    </div>
  );
}
