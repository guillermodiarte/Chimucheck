"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Megaphone,
  Newspaper,
  Calendar,
  Settings,
  LogOut,
  Image as ImageIcon,
  Library,
  Gift,
  Trophy,
  Users,
} from "lucide-react";
import { logout } from "@/app/actions/auth";

export const sidebarData = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: Megaphone,
  },
  {
    title: "Novedades",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    title: "Eventos",
    href: "/admin/events",
    icon: Calendar,
  },
  {
    title: "Torneos",
    href: "/admin/tournaments",
    icon: Trophy,
  },
  {
    title: "Jugadores",
    href: "/admin/players",
    icon: Users,
  },
  {
    title: "Secciones",
    href: "/admin/sections",
    icon: Library,
  },
  {
    title: "Premios",
    href: "/admin/prizes",
    icon: Gift,
  },
  {
    title: "Biblioteca",
    href: "/admin/media",
    icon: ImageIcon,
  },
  {
    title: "Configuración",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 border-r border-gray-800">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight text-secondary">
          Chimucheck Admin
        </h2>
      </div>
      <nav className="px-4 space-y-2 overflow-y-auto">
        {sidebarData.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-secondary text-black"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="p-4 mt-4 border-t border-gray-800">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
