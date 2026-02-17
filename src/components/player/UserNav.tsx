"use client";

import { User, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function UserNav({ player }: { player: any }) {
  const pathname = usePathname();

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 text-white hover:text-primary transition-colors cursor-pointer outline-none">
        {player.image ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/50 group-hover:border-primary transition-all">
            <Image
              src={player.image}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="p-1.5 rounded-full border border-primary/50 bg-primary/10 group-hover:bg-primary/20 transition-all">
            <User size={16} className="text-primary" />
          </div>
        )}
        <span className="font-bold text-sm tracking-wide max-w-[120px] truncate">
          {player.alias || player.name || "Jugador"}
        </span>
      </button>
      {/* Dropdown - identical to main navbar */}
      <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
        <Link
          href="/player/dashboard"
          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors"
        >
          <User size={14} />
          Mi Perfil
        </Link>
        <button
          onClick={async () => {
            const callbackUrl = pathname.startsWith("/player/dashboard") ? "/" : pathname;
            const targetUrl = `${window.location.origin}${callbackUrl}`;
            await signOut({ redirect: false });
            window.location.href = targetUrl;
          }}
          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 transition-colors border-t border-white/5 cursor-pointer"
        >
          <LogOut size={14} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

