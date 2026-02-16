"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const links = [
    { href: "/player/dashboard", label: "Resumen", exact: true },
    { href: "/player/dashboard/tournaments", label: "Torneos", exact: false },
    { href: "/", label: "Inicio", exact: true },
    { href: "/torneos", label: "Torneos Públicos", exact: false },
  ];

  return (
    <nav className="flex items-center space-x-6">
      {links.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname?.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-base font-bold transition-all duration-300 relative group px-1 py-1 ${isActive
                ? "text-primary"
                : "text-gray-300 hover:text-primary hover:scale-110"
              }`}
          >
            {link.label}
            <span
              className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${isActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
            ></span>
          </Link>
        );
      })}
    </nav>
  );
}
