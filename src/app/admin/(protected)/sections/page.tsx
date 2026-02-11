import { db } from "@/lib/prisma";
import { AboutSectionForm } from "@/components/admin/sections/AboutSectionForm";

export default async function SectionsPage() {
  // Fetch existing content or default to null
  const aboutSection = await db.siteSection.findUnique({
    where: { key: "about_us" },
  });

  const aboutContent = aboutSection?.content || { title: "Nuestra Historia", bio: "", instagram: "chimuchek" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editor de Secciones</h1>
        <p className="text-gray-400">Edita los textos estáticos del sitio web.</p>
      </div>

      <div className="grid gap-8 max-w-2xl">
        <AboutSectionForm initialContent={aboutContent} />
        {/* Future: Add Contact Form Editor, Footer Editor, etc. */}
      </div>
    </div>
  );
}
