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
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative h-24">
        <div className="flex items-center justify-between h-full">
          {/* LOGO - Breaks out of container */}
          <div className="absolute top-2 left-4 z-50 pointer-events-auto filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <Link href="/" className="block" onClick={handleHomeClick}>
              <div className="relative h-28 md:h-32 w-auto aspect-[1/1] hover:scale-105 transition-transform duration-300">
                <Image
                  src={logoUrl || "/images/logo5.png"}
                  alt="ChimuCheck Logo"
                  fill
                  className="object-contain object-left-top"
                  priority
                />
              </div>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 justify-end items-start pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 flex items-center space-x-8 shadow-2xl mt-12">
              <Link
                href="/"
                className="text-gray-300 hover:text-primary hover:scale-110 px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group"
                onClick={handleHomeClick}
              >
                Inicio
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
              <Link
                href="/premios"
                className="text-gray-300 hover:text-primary hover:scale-110 px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group"
              >
                Premios
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
              <Link
                href="/torneos"
                className="text-gray-300 hover:text-primary hover:scale-110 px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group"
              >
                Torneos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>
              <Link
                href="/acerca-de"
                className="text-gray-300 hover:text-primary hover:scale-110 px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group"
                onClick={() => window.scrollTo(0, 0)}
              >
                Historia
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link>

              {/* Separator inside pill */}
              <div className="h-6 w-px bg-white/20"></div>

              {/* Social Icons inside pill */}
              <div className="flex items-center space-x-3">
                <a href="https://www.instagram.com/chimucheck/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 hover:scale-125 transition-all duration-300">
                  <Instagram size={18} />
                </a>
                <a href="https://www.twitch.tv/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-500 hover:scale-125 transition-all duration-300">
                  <Twitch size={18} />
                </a>
                <a href="https://www.youtube.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 hover:scale-125 transition-all duration-300">
                  <Youtube size={18} />
                </a>
                <a href="https://www.kick.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 hover:scale-125 transition-all duration-300">
                  <Monitor size={18} />
                </a>
              </div>

              {/* Login inside pill */}
              {session?.user ? (
                <Link
                  href="/player/dashboard"
                  className="flex items-center gap-2 text-white hover:text-primary transition-colors group ml-2"
                >
                  <div className="p-1.5 rounded-full border border-primary/50 bg-primary/10 group-hover:bg-primary/20 transition-all">
                    <User size={16} className="text-primary" />
                  </div>
                </Link>
              ) : (
                <Link
                  href="/player/login"
                  className="flex items-center gap-2 text-primary hover:text-white transition-colors group ml-2"
                >
                  <div className="p-1.5 rounded-full border border-primary/30 group-hover:border-primary/80 group-hover:bg-primary/10 transition-all">
                    <User size={16} />
                  </div>
                  <span className="font-bold text-sm tracking-wide">INGRESAR</span>
                </Link>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden pointer-events-auto">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white bg-black/50 backdrop-blur-md hover:text-primary hover:bg-black/70 focus:outline-none border border-white/10"
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
