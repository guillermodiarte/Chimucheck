"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `text-base font-bold transition-all duration-300 relative group px-1 py-1 ${pathname === path || (path !== "/" && pathname?.startsWith(path))
      ? "text-primary"
      : "text-gray-300 hover:text-primary hover:scale-110"
    }`;

  const underlineClass = (path: string) =>
    `absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === path || (path !== "/" && pathname?.startsWith(path))
      ? "w-full"
      : "w-0 group-hover:w-full"
    }`;

  return (
    <nav className="flex items-center space-x-6">
      <Link href="/" className={linkClass("/")}>
        Inicio
        <span className={underlineClass("/")}></span>
      </Link>

      <Link
        href="/player/dashboard/tournaments"
        className={linkClass("/player/dashboard/tournaments")}
      >
        Torneos
        <span className={underlineClass("/player/dashboard/tournaments")}></span>
      </Link>

      <Link
        href="/player/dashboard/profile"
        className={linkClass("/player/dashboard/profile")}
      >
        Datos Personales
        <span className={underlineClass("/player/dashboard/profile")}></span>
      </Link>
    </nav>
  );
}
