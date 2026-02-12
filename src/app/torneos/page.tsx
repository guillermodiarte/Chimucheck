import Image from "next/image";
import { Construction } from "lucide-react";

export default function TorneosPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/torneos-hero.png"
          alt="Torneos Background"
          fill
          className="object-cover opacity-30 select-none pointer-events-none"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 text-center px-4 space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-700">

        <div className="flex justify-center mb-8">
          <div className="p-6 rounded-full bg-secondary/10 ring-1 ring-secondary/50 shadow-[0_0_30px_-5px_var(--secondary)]">
            <Construction className="w-16 h-16 text-secondary animate-pulse" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          TORNEOS
        </h1>

        <div className="h-1 w-24 bg-secondary mx-auto rounded-full" />

        <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
          Estamos preparando los mejores torneos para ti. <br />
          <span className="text-secondary font-semibold">Próximamente disponible.</span>
        </p>

      </div>
    </main>
  );
}
