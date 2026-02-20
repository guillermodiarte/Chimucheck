"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { HomeSectionForm } from "./HomeSectionForm";
import { AboutSectionForm } from "./AboutSectionForm";
import { GamingSectionForm } from "./GamingSectionForm";
import { SocialsForm } from "./SocialsForm";
import { StreamingForm } from "./StreamingForm";
import PrizesPageConfig from "../prizes/PrizesPageConfig";
import { Home, BookOpen, ArrowLeft, ChevronRight, Gift, Gamepad2, ImageIcon, Share2, Video } from "lucide-react";

interface SectionsDashboardProps {
  homeContent: any;
  aboutContent: any;
  gamingContent: any;
  socialsContent: any;
  streamingContent: any;
  prizesData: {
    initialPrizes: any[];
    initialConfig: any;
  };
}

export function SectionsDashboard({ homeContent, aboutContent, gamingContent, socialsContent, streamingContent, prizesData }: SectionsDashboardProps) {
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

  if (selectedSection === "gaming") {
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
          <GamingSectionForm initialContent={gamingContent} />
        </div>
      </div>
    );
  }

  if (selectedSection === "socials") {
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
          <SocialsForm initialContent={socialsContent} />
        </div>
      </div>
    );
  }

  if (selectedSection === "streaming") {
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
          <StreamingForm initialContent={streamingContent} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
      {/* Home (Logo) Card */}
      <div
        onClick={() => handleSelectSection("home")}
        className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 md:p-6 hover:border-secondary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-95 md:active:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
            <ImageIcon className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">Logo de la Página</h3>
        <p className="text-gray-400 text-sm">Cambia la imagen principal del logo que aparece en la parte superior.</p>

        {/* Preview mini-images or colors */}
        <div className="mt-6 flex gap-2">
          <div className="h-2 w-12 rounded-full bg-blue-500/30"></div>
          <div className="h-2 w-6 rounded-full bg-gray-700"></div>
        </div>
      </div>

      {/* Socials Card */}
      <div
        onClick={() => handleSelectSection("socials")}
        className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 md:p-6 hover:border-secondary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-95 md:active:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/20 transition-colors">
            <Share2 className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">Redes Sociales</h3>
        <p className="text-gray-400 text-sm">Configura los enlaces a tus perfiles de redes, mostrados globalmente.</p>

        <div className="mt-6 flex gap-2">
          <div className="h-2 w-8 rounded-full bg-indigo-500/30"></div>
          <div className="h-2 w-10 rounded-full bg-indigo-500/30"></div>
          <div className="h-2 w-8 rounded-full bg-gray-700"></div>
        </div>
      </div>

      {/* Streaming Card */}
      <div
        onClick={() => handleSelectSection("streaming")}
        className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 md:p-6 hover:border-secondary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-95 md:active:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-500/10 rounded-lg text-red-500 group-hover:text-red-400 group-hover:bg-red-500/20 transition-colors">
            <Video className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">Streaming / En Vivo</h3>
        <p className="text-gray-400 text-sm">Activa y configura canales de Twitch y YouTube para mostrarlos en la web.</p>

        <div className="mt-6 flex gap-2">
          <div className="h-2 w-10 rounded-full bg-red-500/30"></div>
          <div className="h-2 w-6 rounded-full bg-red-500/30"></div>
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

      {/* Gaming Card */}
      <div
        onClick={() => handleSelectSection("gaming")}
        className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-5 md:p-6 hover:border-secondary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-95 md:active:scale-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-500/10 rounded-lg text-red-500 group-hover:text-red-400 group-hover:bg-red-500/20 transition-colors">
            <Gamepad2 className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">Zona Gaming</h3>
        <p className="text-gray-400 text-sm">Edita la sección de torneos, tarjetas de juegos y botón de inscripción.</p>

        <div className="mt-6 flex gap-2">
          <div className="h-2 w-6 rounded-full bg-red-500/30"></div>
          <div className="h-2 w-12 rounded-full bg-gray-700"></div>
        </div>
      </div>

    </div>
  );
}
