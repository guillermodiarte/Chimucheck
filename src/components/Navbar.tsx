"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Instagram, Youtube, Twitch, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar({ logoUrl, logoText }: { logoUrl?: string; logoText?: string }) {
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
              {/* <Link
                href="#news"
                className="text-gray-300 hover:text-primary hover:scale-110 px-3 py-2 rounded-md text-base font-bold transition-all duration-300 relative group"
                onClick={(e) => {
                  e.preventDefault();
                  if (pathname !== '/') {
                    window.location.href = '/#news';
                  } else {
                    document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Novedades
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </Link> */}
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
            <a href="https://www.instagram.com/chimucheck/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 hover:scale-125 transition-all duration-300">
              <Instagram size={22} />
            </a>
            <a href="https://www.twitch.tv/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-500 hover:scale-125 transition-all duration-300">
              <Twitch size={22} />
            </a>
            <a href="https://www.youtube.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 hover:scale-125 transition-all duration-300">
              <Youtube size={22} />
            </a>
            <a href="https://www.kick.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 hover:scale-125 transition-all duration-300">
              <Monitor size={22} />
            </a>
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
              >{/* // turbo-all */}
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
              {/* <Link
                href="#news"
                className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  if (pathname !== '/') {
                    window.location.href = '/#news';
                  } else {
                    document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' });
                  }
                  setIsOpen(false);
                }}
              >
                Novedades
              </Link> */}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
