"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/player/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-yellow-400",
          pathname === "/player/dashboard" ? "text-white" : "text-gray-400"
        )}
      >
        Resumen
      </Link>
      <Link
        href="/player/dashboard/tournaments"
        className={cn(
          "text-sm font-medium transition-colors hover:text-yellow-400",
          pathname?.startsWith("/player/dashboard/tournaments") ? "text-white" : "text-gray-400"
        )}
      >
        Torneos
      </Link>
    </nav>
  );
}
