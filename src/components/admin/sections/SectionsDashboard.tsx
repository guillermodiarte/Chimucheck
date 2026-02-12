"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { HomeSectionForm } from "./HomeSectionForm";
import { AboutSectionForm } from "./AboutSectionForm";
import PrizesPageConfig from "../prizes/PrizesPageConfig";
import { Home, BookOpen, ArrowLeft, ChevronRight, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionsDashboardProps {
  homeContent: any;
  aboutContent: any;
  prizesData: {
    initialPrizes: any[];
    initialConfig: any;
  };
}

export function SectionsDashboard({ homeContent, aboutContent, prizesData }: SectionsDashboardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedSection = searchParams.get("section");

  const handleSelectSection = (section: string | null) => {
    if (section) {
      router.push(`${pathname}?section=${section}`);
    } else {
      router.push(pathname);
    }
  };

  if (selectedSection === "home") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => handleSelectSection(null)}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Secciones
        </button>
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <HomeSectionForm initialContent={homeContent} />
        </div>
      </div>
    );
  }

  if (selectedSection === "about") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => handleSelectSection(null)}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Secciones
        </button>
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <AboutSectionForm initialContent={aboutContent} />
        </div>
      </div>
    );
  }

  if (selectedSection === "prizes") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => handleSelectSection(null)}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Secciones
        </button>
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <PrizesPageConfig initialConfig={prizesData.initialConfig} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
      {/* Home Card */}
      <div
        onClick={() => handleSelectSection("home")}
        className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 md:p-6 hover:border-secondary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-95 md:active:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
            <Home className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">Inicio</h3>
        <p className="text-gray-400 text-sm">Configuración general de la página principal, incluyendo logo y banner.</p>

        {/* Preview mini-images or colors */}
        <div className="mt-6 flex gap-2">
          <div className="h-2 w-12 rounded-full bg-blue-500/30"></div>
          <div className="h-2 w-6 rounded-full bg-gray-700"></div>
        </div>
      </div>

      {/* About Card */}
      <div
        onClick={() => handleSelectSection("about")}
        className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 md:p-6 hover:border-secondary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-95 md:active:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 group-hover:text-purple-300 group-hover:bg-purple-500/20 transition-colors">
            <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">Historia / Acerca de</h3>
        <p className="text-gray-400 text-sm">Edita la biografía, imagen de perfil e información de la sección Historia.</p>

        <div className="mt-6 flex gap-2">
          <div className="h-2 w-8 rounded-full bg-purple-500/30"></div>
          <div className="h-2 w-10 rounded-full bg-gray-700"></div>
        </div>
      </div>

      {/* Prizes Card */}
      <div
        onClick={() => handleSelectSection("prizes")}
        className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 md:p-6 hover:border-secondary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-95 md:active:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-400 group-hover:text-green-300 group-hover:bg-green-500/20 transition-colors">
            <Gift className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">Premios</h3>
        <p className="text-gray-400 text-sm">Gestiona el catálogo de premios, precios y descripciones de la página.</p>

        <div className="mt-6 flex gap-2">
          <div className="h-2 w-10 rounded-full bg-green-500/30"></div>
          <div className="h-2 w-4 rounded-full bg-gray-700"></div>
          <div className="h-2 w-8 rounded-full bg-green-500/30"></div>
        </div>
      </div>
    </div>
  );
}
