"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { sidebarData } from "./Sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-gray-900 border-r-gray-800 text-white p-0 w-72">
          <VisuallyHidden>
            <SheetTitle>Menú de Navegación</SheetTitle>
            <SheetDescription>Opciones del panel de administración</SheetDescription>
          </VisuallyHidden>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold tracking-tight text-secondary">
                Chimucheck Admin
              </h2>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {sidebarData.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
            <div className="p-4 border-t border-gray-800">
              <form action={async () => {
                await logout();
                setOpen(false);
              }}>
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
        </SheetContent>
      </Sheet>
      <h2 className="text-lg font-bold tracking-tight text-secondary">
        Chimucheck Admin
      </h2>
    </div>
  );
}
