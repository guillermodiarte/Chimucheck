"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-6">
      <Link
        href="/player/dashboard"
        className={`text-base font-bold transition-all duration-300 relative group px-1 py-1 ${pathname === "/player/dashboard"
            ? "text-primary"
            : "text-gray-300 hover:text-primary hover:scale-110"
          }`}
      >
        Resumen
        <span
          className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === "/player/dashboard" ? "w-full" : "w-0 group-hover:w-full"
            }`}
        ></span>
      </Link>

      <div className="relative group">
        <button
          className={`flex items-center gap-1 text-base font-bold transition-all duration-300 px-1 py-1 outline-none ${pathname?.startsWith("/player/dashboard/tournaments")
              ? "text-primary"
              : "text-gray-300 hover:text-primary hover:scale-110"
            }`}
        >
          Torneos
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Hover Dropdown */}
        <div className="absolute left-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
          <Link
            href="/player/dashboard/tournaments/my-tournaments"
            className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors border-b border-white/5"
          >
            Mis Inscriptos
          </Link>
          <Link
            href="/player/dashboard/tournaments/available"
            className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors"
          >
            Disponibles
          </Link>
        </div>
      </div>

      <Link
        href="/player/dashboard/profile"
        className={`text-base font-bold transition-all duration-300 relative group px-1 py-1 ${pathname === "/player/dashboard/profile"
            ? "text-primary"
            : "text-gray-300 hover:text-primary hover:scale-110"
          }`}
      >
        Mi Cuenta
        <span
          className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === "/player/dashboard/profile" ? "w-full" : "w-0 group-hover:w-full"
            }`}
        ></span>
      </Link>
    </nav>
  );
}
