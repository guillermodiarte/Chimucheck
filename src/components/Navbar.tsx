"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, Instagram, Youtube, Twitch, Monitor, User, LogOut, MessageCircle, Twitter, Facebook } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import { getSocialConfig } from "@/lib/utils";

export default function Navbar({ logoUrl, logoText, session: initialSession, socialLinks }: { logoUrl?: string; logoText?: string; session?: Session | null; socialLinks?: any }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const pathname = usePathname();

  const openLogin = useCallback(() => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  }, []);

  const openRegister = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  }, []);

  // Listen for custom event from other components (e.g. tournament page)
  useEffect(() => {
    const handler = () => openLogin();
    window.addEventListener("open-login-modal", handler);
    return () => window.removeEventListener("open-login-modal", handler);
  }, []);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 pointer-events-none">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative h-24">
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
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${pathname === "/" ? "text-primary" : "text-gray-300 hover:text-primary hover:scale-110"}`}
                  onClick={handleHomeClick}
                >
                  Inicio
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === "/" ? "w-full" : "w-0 group-hover:w-full"}`}></span>
                </Link>
                <Link
                  href="/premios"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${pathname === "/premios" ? "text-primary" : "text-gray-300 hover:text-primary hover:scale-110"}`}
                >
                  Premios
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === "/premios" ? "w-full" : "w-0 group-hover:w-full"}`}></span>
                </Link>
                <Link
                  href="/torneos"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${pathname === "/torneos" ? "text-primary" : "text-gray-300 hover:text-primary hover:scale-110"}`}
                >
                  Torneos
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === "/torneos" ? "w-full" : "w-0 group-hover:w-full"}`}></span>
                </Link>
                <Link
                  href="/acerca-de"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${pathname === "/acerca-de" ? "text-primary" : "text-gray-300 hover:text-primary hover:scale-110"}`}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Historia
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${pathname === "/acerca-de" ? "w-full" : "w-0 group-hover:w-full"}`}></span>
                </Link>


                {/* Separator inside pill */}
                <div className="h-6 w-px bg-white/20"></div>

                {/* Social Icons inside pill */}
                <div className="flex items-center space-x-3">
                  {(() => {
                    const inst = getSocialConfig(socialLinks, "instagram");
                    const fb = getSocialConfig(socialLinks, "facebook");
                    const tw = getSocialConfig(socialLinks, "twitter");
                    const wa = getSocialConfig(socialLinks, "whatsapp");
                    const twitch = getSocialConfig(socialLinks, "twitch");
                    const yt = getSocialConfig(socialLinks, "youtube");
                    const kick = getSocialConfig(socialLinks, "kick");
                    const tiktok = getSocialConfig(socialLinks, "tiktok");

                    return (
                      <>
                        {inst.active && (
                          <a href={inst.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 hover:scale-125 transition-all duration-300">
                            <Instagram size={18} />
                          </a>
                        )}
                        {fb.active && (
                          <a href={fb.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 hover:scale-125 transition-all duration-300">
                            <Facebook size={18} />
                          </a>
                        )}
                        {tw.active && (
                          <a href={tw.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 hover:scale-125 transition-all duration-300">
                            <Twitter size={18} />
                          </a>
                        )}
                        {wa.active && (
                          <a href={wa.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 hover:scale-125 transition-all duration-300">
                            <MessageCircle size={18} />
                          </a>
                        )}
                        {twitch.active && (
                          <a href={twitch.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-500 hover:scale-125 transition-all duration-300">
                            <Twitch size={18} />
                          </a>
                        )}
                        {yt.active && (
                          <a href={yt.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 hover:scale-125 transition-all duration-300">
                            <Youtube size={18} />
                          </a>
                        )}
                        {kick.active && (
                          <a href={kick.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 hover:scale-125 transition-all duration-300">
                            <Monitor size={18} />
                          </a>
                        )}
                        {tiktok.active && (
                          <a href={tiktok.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white hover:scale-125 transition-all duration-300">
                            <TikTokIcon size={18} />
                          </a>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Login inside pill */}
                {session?.user ? (
                  <div className="relative group ml-2">
                    <Link
                      href="/player/dashboard/profile"
                      className="flex items-center gap-2 text-white hover:text-primary transition-colors"
                    >
                      {(session.user as any).image ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/50 group-hover:border-primary transition-all">
                          <Image
                            src={(session.user as any).image}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-full border border-primary/50 bg-primary/10 group-hover:bg-primary/20 transition-all">
                          <User size={16} className="text-primary" />
                        </div>
                      )}
                      <span className="font-bold text-sm tracking-wide max-w-[120px] truncate">
                        {(session.user as any).alias || session.user.name || "Jugador"}
                      </span>
                    </Link>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                      <Link
                        href="/player/dashboard/profile"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors"
                      >
                        <User size={14} />
                        Datos Personales
                      </Link>
                      <button
                        onClick={async () => {
                          const callbackUrl = pathname.startsWith("/player/dashboard") ? "/" : pathname;
                          const targetUrl = `${window.location.origin}${callbackUrl}`;
                          await signOut({ redirect: false });
                          window.location.href = targetUrl;
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 transition-colors border-t border-white/5 cursor-pointer"
                      >
                        <LogOut size={14} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={openLogin}
                    className="flex items-center gap-2 text-primary hover:text-white transition-colors group ml-2 cursor-pointer"
                  >
                    <div className="p-1.5 rounded-full border border-primary/30 group-hover:border-primary/80 group-hover:bg-primary/10 transition-all">
                      <User size={16} />
                    </div>
                    <span className="font-bold text-sm tracking-wide">INGRESAR</span>
                  </button>
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
                  className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/" ? "text-primary" : "text-white hover:text-primary"}`}
                  onClick={handleHomeClick}
                >
                  Inicio
                </Link>
                <Link
                  href="/premios"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/premios" ? "text-primary" : "text-white hover:text-primary"}`}
                  onClick={() => setIsOpen(false)}
                >
                  Premios
                </Link>
                <Link
                  href="/torneos"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/torneos" ? "text-primary" : "text-white hover:text-primary"}`}
                  onClick={() => setIsOpen(false)}
                >
                  Torneos
                </Link>
                <Link
                  href="/acerca-de"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/acerca-de" ? "text-primary" : "text-white hover:text-primary"}`}
                  onClick={() => {
                    setIsOpen(false);
                    window.scrollTo(0, 0);
                  }}
                >
                  Historia
                </Link>
                {session?.user ? (
                  <>
                    <Link
                      href="/player/dashboard/profile"
                      className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 text-gray-300"
                      onClick={() => setIsOpen(false)}
                    >
                      {(session.user as any).image ? (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-primary/50">
                          <Image
                            src={(session.user as any).image}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <User size={18} className="text-primary" />
                      )}
                      {(session.user as any).alias || session.user.name || "Datos Personales"}
                    </Link>
                    <button
                      onClick={async () => {
                        setIsOpen(false);
                        const callbackUrl = pathname.startsWith("/player/dashboard") ? "/" : pathname;
                        const targetUrl = `${window.location.origin}${callbackUrl}`;
                        await signOut({ redirect: false });
                        window.location.href = targetUrl;
                      }}
                      className="hover:text-red-400 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 text-gray-400 w-full cursor-pointer"
                    >
                      <LogOut size={18} />
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openLogin();
                    }}
                    className="hover:text-primary block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 text-gray-300 w-full cursor-pointer"
                  >
                    <User size={18} className="text-primary" />
                    Ingresar
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={openRegister}
      />
      <RegisterModal
        key={showRegisterModal ? "open" : "closed"}
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={openLogin}
      />
    </>
  );
}
