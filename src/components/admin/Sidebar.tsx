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
  Gift,
  Trophy,
  Swords,
  Users,
  LayoutTemplate,
  UserCheck,
  Gamepad2,
  Ticket,
  Vote,
  Dices,
} from "lucide-react";
import { logout } from "@/app/actions/auth";

export interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  badge?: number;
}

export function getSidebarItems(showRequests = false, pendingCount = 0): SidebarItem[] {
  const items: SidebarItem[] = [
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
      title: "Desafíos",
      href: "/admin/challenges",
      icon: Swords,
    },
    {
      title: "Sorteos",
      href: "/admin/raffles",
      icon: Ticket,
    },
    {
      title: "Votaciones",
      href: "/admin/voting",
      icon: Vote,
    },
  ];

  if (showRequests) {
    items.push({
      title: "Solicitudes",
      href: "/admin/requests",
      icon: UserCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    });
  }

  items.push(
    {
      title: "Jugadores",
      href: "/admin/players",
      icon: Users,
    },
    {
      title: "Secciones",
      href: "/admin/sections",
      icon: LayoutTemplate,
    },
    {
      title: "Premios",
      href: "/admin/prizes",
      icon: Gift,
    },
    {
      title: "Juegos",
      href: "/admin/games",
      icon: Gamepad2,
    },
    {
      title: "Ruleta",
      href: "/admin/roulette",
      icon: Dices,
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
    }
  );

  return items;
}

export const sidebarData = getSidebarItems(false);

interface SidebarProps {
  showRequests?: boolean;
  pendingCount?: number;
}

export function Sidebar({ showRequests = false, pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const items = getSidebarItems(showRequests, pendingCount);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 border-r border-gray-800">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight text-secondary">
          Chimucheck Admin
        </h2>
      </div>
      <nav className="px-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-black"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.title}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full transition-colors",
                    isActive
                      ? "bg-black text-secondary"
                      : "bg-secondary text-black"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
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
