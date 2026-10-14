"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  Menu,
  X,
  Instagram,
  Youtube,
  Twitch,
  Monitor,
  User,
  LogOut,
  MessageCircle,
  Twitter,
  Facebook,
  Ticket,
  Trophy,
  Home,
  Award,
  BookOpen,
  Vote,
  LogIn,
} from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";
import { getSocialConfig } from "@/lib/utils";

export default function Navbar({
  logoUrl,
  logoText,
  session: initialSession,
  socialLinks,
}: {
  logoUrl?: string;
  logoText?: string;
  session?: Session | null;
  socialLinks?: any;
}) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const pathname = usePathname();

  const [loginCallbackUrl, setLoginCallbackUrl] = useState<string | null>(null);

  const openLogin = useCallback((param?: string | React.MouseEvent) => {
    setLoginCallbackUrl(typeof param === "string" ? param : null);
    setShowRegisterModal(false);
    setShowLoginModal(true);
  }, []);

  const openRegister = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  }, []);

  // Listen for custom event from other components (e.g. tournament page, voting)
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ callbackUrl?: string }>;
      openLogin(customEvent.detail?.callbackUrl);
    };
    window.addEventListener("open-login-modal", handler);
    return () => window.removeEventListener("open-login-modal", handler);
  }, [openLogin]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const isNavActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/torneos") return pathname === "/torneos" || pathname.startsWith("/torneos");
    if (href === "/sorteos")
      return (
        pathname === "/sorteos" ||
        pathname.startsWith("/sorteos") ||
        pathname.startsWith("/player/dashboard/raffles")
      );
    if (href === "/votaciones") return pathname.startsWith("/votaciones");
    if (href === "/premios") return pathname === "/premios";
    if (href === "/acerca-de") return pathname === "/acerca-de";
    return pathname === href;
  };

  const navItems = [
    { href: "/", label: "Inicio", icon: Home, isHome: true },
    { href: "/premios", label: "Premios", icon: Award },
    { href: "/torneos", label: "Torneos", icon: Trophy },
    { href: "/sorteos", label: "Sorteos", icon: Ticket },
    { href: "/votaciones", label: "Votaciones", icon: Vote },
    { href: "/acerca-de", label: "Historia", icon: BookOpen, scrollToTop: true },
  ];

  const socialConfig = {
    instagram: getSocialConfig(socialLinks, "instagram"),
    facebook: getSocialConfig(socialLinks, "facebook"),
    twitter: getSocialConfig(socialLinks, "twitter"),
    whatsapp: getSocialConfig(socialLinks, "whatsapp"),
    twitch: getSocialConfig(socialLinks, "twitch"),
    youtube: getSocialConfig(socialLinks, "youtube"),
    kick: getSocialConfig(socialLinks, "kick"),
    tiktok: getSocialConfig(socialLinks, "tiktok"),
  };

  const hasAnySocial =
    socialConfig.instagram.active ||
    socialConfig.facebook.active ||
    socialConfig.twitter.active ||
    socialConfig.whatsapp.active ||
    socialConfig.twitch.active ||
    socialConfig.youtube.active ||
    socialConfig.kick.active ||
    socialConfig.tiktok.active;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 pointer-events-none">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative h-20 md:h-24">
          <div className="flex items-center justify-between h-full">
            {/* LOGO - Breaks out of container */}
            <div className="absolute top-2 left-4 z-50 pointer-events-auto filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <Link href="/" className="block" onClick={handleHomeClick}>
                <div className="relative h-24 sm:h-28 md:h-32 w-24 sm:w-28 md:w-32 aspect-[1/1] hover:scale-105 transition-transform duration-300">
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

            {/* Desktop Navigation Pill */}
            <div className="hidden md:flex flex-1 justify-end items-start pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 flex items-center space-x-8 shadow-2xl mt-12">
                <Link
                  href="/"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${
                    pathname === "/" ? "text-primary" : "text-gray-300 hover:text-primary hover:scale-110"
                  }`}
                  onClick={handleHomeClick}
                >
                  Inicio
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                      pathname === "/" ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
                <Link
                  href="/premios"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${
                    pathname === "/premios" ? "text-primary" : "text-gray-300 hover:text-primary hover:scale-110"
                  }`}
                >
                  Premios
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                      pathname === "/premios" ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
                <Link
                  href="/torneos"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${
                    pathname === "/torneos" || pathname.startsWith("/torneos")
                      ? "text-primary"
                      : "text-gray-300 hover:text-primary hover:scale-110"
                  }`}
                >
                  Torneos
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                      pathname === "/torneos" || pathname.startsWith("/torneos")
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
                <Link
                  href="/sorteos"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${
                    pathname === "/sorteos" ||
                    pathname.startsWith("/sorteos") ||
                    pathname.startsWith("/player/dashboard/raffles")
                      ? "text-primary"
                      : "text-gray-300 hover:text-primary hover:scale-110"
                  }`}
                >
                  Sorteos
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                      pathname === "/sorteos" ||
                      pathname.startsWith("/sorteos") ||
                      pathname.startsWith("/player/dashboard/raffles")
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
                <Link
                  href="/votaciones"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${
                    pathname.startsWith("/votaciones")
                      ? "text-primary"
                      : "text-gray-300 hover:text-primary hover:scale-110"
                  }`}
                >
                  Votaciones
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                      pathname.startsWith("/votaciones") ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
                <Link
                  href="/acerca-de"
                  className={`px-2 py-1 rounded-md text-base font-bold transition-all duration-300 relative group ${
                    pathname === "/acerca-de" ? "text-primary" : "text-gray-300 hover:text-primary hover:scale-110"
                  }`}
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Historia
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all ${
                      pathname === "/acerca-de" ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>

                {/* Separator inside pill */}
                <div className="h-6 w-px bg-white/20"></div>

                {/* Social Icons inside pill */}
                <div className="flex items-center space-x-3">
                  {socialConfig.instagram.active && (
                    <a
                      href={socialConfig.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-pink-500 hover:scale-125 transition-all duration-300"
                    >
                      <Instagram size={18} />
                    </a>
                  )}
                  {socialConfig.facebook.active && (
                    <a
                      href={socialConfig.facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-500 hover:scale-125 transition-all duration-300"
                    >
                      <Facebook size={18} />
                    </a>
                  )}
                  {socialConfig.twitter.active && (
                    <a
                      href={socialConfig.twitter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400 hover:scale-125 transition-all duration-300"
                    >
                      <Twitter size={18} />
                    </a>
                  )}
                  {socialConfig.whatsapp.active && (
                    <a
                      href={socialConfig.whatsapp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-500 hover:scale-125 transition-all duration-300"
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                  {socialConfig.twitch.active && (
                    <a
                      href={socialConfig.twitch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-purple-500 hover:scale-125 transition-all duration-300"
                    >
                      <Twitch size={18} />
                    </a>
                  )}
                  {socialConfig.youtube.active && (
                    <a
                      href={socialConfig.youtube.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-red-500 hover:scale-125 transition-all duration-300"
                    >
                      <Youtube size={18} />
                    </a>
                  )}
                  {socialConfig.kick.active && (
                    <a
                      href={socialConfig.kick.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-500 hover:scale-125 transition-all duration-300"
                    >
                      <Monitor size={18} />
                    </a>
                  )}
                  {socialConfig.tiktok.active && (
                    <a
                      href={socialConfig.tiktok.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white hover:scale-125 transition-all duration-300"
                    >
                      <TikTokIcon size={18} />
                    </a>
                  )}
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
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                      <Link
                        href="/player/dashboard/raffles"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors"
                      >
                        <Ticket size={14} className="text-secondary" />
                        Sorteos
                      </Link>
                      <Link
                        href="/player/dashboard/tournaments"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors border-t border-white/5"
                      >
                        <Trophy size={14} className="text-yellow-400" />
                        Mis Torneos
                      </Link>
                      <Link
                        href="/player/dashboard/profile"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-primary transition-colors border-t border-white/5"
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

            {/* Mobile Menu Button */}
            <div className="ml-auto flex md:hidden pointer-events-auto z-50">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isOpen}
                className="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl text-white bg-black/70 backdrop-blur-xl border border-white/15 hover:border-primary/50 hover:text-primary active:scale-95 transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
              >
                {isOpen ? (
                  <>
                    <X size={18} className="text-primary" />
                    <span className="text-sm font-bold text-primary">Cerrar</span>
                  </>
                ) : (
                  <span className="text-sm font-bold tracking-wide">Menú</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Backdrop & Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 pointer-events-auto md:hidden"
              />

              {/* Mobile Dropdown Menu Drawer */}
              <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative z-50 md:hidden bg-gradient-to-b from-zinc-950/98 via-zinc-900/98 to-black/98 backdrop-blur-2xl border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto max-h-[calc(100vh-5.5rem)] overflow-y-auto"
              >
                <div className="px-4 py-4 space-y-4">
                  {/* Main Navigation Items */}
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const active = isNavActive(item.href);
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(e) => {
                            if (item.isHome) handleHomeClick(e);
                            else if (item.scrollToTop) {
                              setIsOpen(false);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            } else {
                              setIsOpen(false);
                            }
                          }}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-semibold transition-all duration-200 ${
                            active
                              ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <IconComponent size={20} className={active ? "text-primary" : "text-gray-400"} />
                          <span>{item.label}</span>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/10" />

                  {/* User / Authentication Section */}
                  <div>
                    {session?.user ? (
                      <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-3">
                        <div className="flex items-center gap-3 px-1 py-1">
                          {(session.user as any).image ? (
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary/60 shrink-0">
                              <Image
                                src={(session.user as any).image}
                                alt="Avatar"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="p-2 rounded-full border border-primary/50 bg-primary/10 shrink-0">
                              <User size={18} className="text-primary" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm truncate">
                              {(session.user as any).alias || session.user.name || "Jugador"}
                            </p>
                            <p className="text-xs text-primary/80 truncate">Cuenta Activa</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 space-y-1">
                          <Link
                            href="/player/dashboard/tournaments"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Trophy size={16} className="text-yellow-400" />
                            <span>Mis Torneos</span>
                          </Link>
                          <Link
                            href="/player/dashboard/raffles"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Ticket size={16} className="text-secondary" />
                            <span>Sorteos</span>
                          </Link>
                          <Link
                            href="/player/dashboard/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <User size={16} className="text-primary" />
                            <span>Datos Personales</span>
                          </Link>
                          <button
                            type="button"
                            onClick={async () => {
                              setIsOpen(false);
                              const callbackUrl = pathname.startsWith("/player/dashboard") ? "/" : pathname;
                              const targetUrl = `${window.location.origin}${callbackUrl}`;
                              await signOut({ redirect: false });
                              window.location.href = targetUrl;
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                          >
                            <LogOut size={16} />
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            openLogin();
                          }}
                          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-primary to-secondary text-black hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
                        >
                          <LogIn size={18} />
                          <span>INGRESAR</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Social Media Links */}
                  {hasAnySocial && (
                    <>
                      <div className="h-px bg-white/10" />
                      <div className="pt-1 pb-2">
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3 text-center">
                          Seguinos en redes
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          {socialConfig.instagram.active && (
                            <a
                              href={socialConfig.instagram.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-pink-500 hover:bg-white/10 transition-colors"
                            >
                              <Instagram size={20} />
                            </a>
                          )}
                          {socialConfig.facebook.active && (
                            <a
                              href={socialConfig.facebook.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Facebook"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-blue-500 hover:bg-white/10 transition-colors"
                            >
                              <Facebook size={20} />
                            </a>
                          )}
                          {socialConfig.twitter.active && (
                            <a
                              href={socialConfig.twitter.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Twitter"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-blue-400 hover:bg-white/10 transition-colors"
                            >
                              <Twitter size={20} />
                            </a>
                          )}
                          {socialConfig.whatsapp.active && (
                            <a
                              href={socialConfig.whatsapp.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="WhatsApp"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-green-500 hover:bg-white/10 transition-colors"
                            >
                              <MessageCircle size={20} />
                            </a>
                          )}
                          {socialConfig.twitch.active && (
                            <a
                              href={socialConfig.twitch.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Twitch"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-purple-500 hover:bg-white/10 transition-colors"
                            >
                              <Twitch size={20} />
                            </a>
                          )}
                          {socialConfig.youtube.active && (
                            <a
                              href={socialConfig.youtube.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="YouTube"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-red-500 hover:bg-white/10 transition-colors"
                            >
                              <Youtube size={20} />
                            </a>
                          )}
                          {socialConfig.kick.active && (
                            <a
                              href={socialConfig.kick.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Kick"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-green-400 hover:bg-white/10 transition-colors"
                            >
                              <Monitor size={20} />
                            </a>
                          )}
                          {socialConfig.tiktok.active && (
                            <a
                              href={socialConfig.tiktok.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="TikTok"
                              className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <TikTokIcon size={20} />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setLoginCallbackUrl(null);
        }}
        onSwitchToRegister={openRegister}
        customCallbackUrl={loginCallbackUrl}
      />
      {/* RegisterModal oculto según solicitud — registro solo vía OAuth */}
      {/* <RegisterModal
        key={showRegisterModal ? "open" : "closed"}
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={openLogin}
      /> */}
    </>
  );
}
