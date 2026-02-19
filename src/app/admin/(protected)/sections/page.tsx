import { getGamingItems } from "@/app/actions/gaming";
import GamingZoneForm from "@/components/admin/GamingZoneForm";
import LogoForm from "@/components/admin/LogoForm";
import { db } from "@/lib/prisma";

export default async function SectionsPage() {
  const gamingItems = await getGamingItems();

  // Fetch home section for logo
  const homeSection = await db.siteSection.findUnique({
    where: { key: "home_section" }
  });
  const homeData = homeSection?.content || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Secciones</h1>
          <p className="text-gray-400">Configura el contenido dinámico de la página principal.</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-12">
        {/* LOGO SECTION */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-primary pl-4">Identidad & Logo</h2>
          <LogoForm initialData={homeData} />
        </section>

        {/* GAMING ZONE SECTION */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 border-l-4 border-primary pl-4">Zona Gaming</h2>
          <GamingZoneForm initialItems={gamingItems} />
        </section>
      </div>
    </div>
  );
}
