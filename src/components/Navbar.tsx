"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Instagram, Youtube, Twitch, Monitor, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";

export default function Navbar({ logoUrl, logoText, session: initialSession }: { logoUrl?: string; logoText?: string; session?: Session | null }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-auto py-2">
          <div className="flex items-center">

            <Link href="/" className="flex items-center gap-3" onClick={handleHomeClick}>
              <div className="relative h-12 w-auto aspect-[2/1]">
                <Image
                  src={logoUrl || "/images/logo5.png"}
                  alt="ChimuCheck Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              {logoText && (
                <span className="text-white font-bold text-xl tracking-wider uppercase hidden sm:block">
                  {logoText}
                </span>
              )}
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/"
                className="text-gray-300 hover:text-primary hover:scale-110 px-3 py-2 rounded-md text-base font-bold transition-all duration-300 relative group"
                onClick={handleHomeClick}
              >
                Inicio
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
              <Link
                href="/premios"
                className="text-gray-300 hover:text-primary hover:scale-110 px-3 py-2 rounded-md text-base font-bold transition-all duration-300 relative group"
              >
                Premios
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
              <Link
                href="/torneos"
                className="text-gray-300 hover:text-primary hover:scale-110 px-3 py-2 rounded-md text-base font-bold transition-all duration-300 relative group"
              >
                Torneos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
              <Link
                href="/acerca-de"
                className="text-gray-300 hover:text-primary hover:scale-110 px-3 py-2 rounded-md text-base font-bold transition-all duration-300 relative group"
                onClick={() => window.scrollTo(0, 0)}
              >
                Historia
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <a href="https://www.instagram.com/chimucheck/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 hover:scale-125 transition-all duration-300">
                <Instagram size={20} />
              </a>
              <a href="https://www.twitch.tv/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-500 hover:scale-125 transition-all duration-300">
                <Twitch size={20} />
              </a>
              <a href="https://www.youtube.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 hover:scale-125 transition-all duration-300">
                <Youtube size={20} />
              </a>
              <a href="https://www.kick.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 hover:scale-125 transition-all duration-300">
                <Monitor size={20} />
              </a>
            </div>

            <div className="h-6 w-px bg-white/20"></div>

            {session?.user ? (
              <Link
                href="/player/dashboard"
                className="flex items-center gap-2 text-white hover:text-primary transition-colors group"
              >
                <div className="p-1.5 rounded-full border border-primary/50 bg-primary/10 group-hover:bg-primary/20 transition-all">
                  <User size={16} className="text-primary" />
                </div>
                <span className="font-bold text-sm tracking-wide">
                  {/* Show alias if available, otherwise name or "Jugador" */}
                  {(session.user as any).alias || session.user.name || "Jugador"}
                </span>
              </Link>
            ) : (
              <Link
                href="/player/login"
                className="flex items-center gap-2 text-primary hover:text-white transition-colors group"
              >
                <div className="p-1.5 rounded-full border border-primary/30 group-hover:border-primary/80 group-hover:bg-primary/10 transition-all">
                  <User size={16} />
                </div>
                <span className="font-bold text-sm tracking-wide">INGRESAR</span>
              </Link>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/"
                className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={handleHomeClick}
              >
                Inicio
              </Link>
              <Link
                href="/premios"
                className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Premios
              </Link>
              <Link
                href="/torneos"
                className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Torneos
              </Link>
              <Link
                href="/acerca-de"
                className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => {
                  setIsOpen(false);
                  window.scrollTo(0, 0);
                }}
              >
                Historia
              </Link>
              {session?.user ? (
                <Link
                  href="/player/dashboard"
                  className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 text-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={18} className="text-primary" />
                  {(session.user as any).alias || session.user.name || "Mi Cuenta"}
                </Link>
              ) : (
                <Link
                  href="/player/login"
                  className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 text-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={18} className="text-primary" />
                  Ingresar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
