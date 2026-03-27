"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, UserPlus, Gamepad2, Check, UserCheck, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [restrictRegistration, setRestrictRegistration] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setRestrictRegistration(data.restrictRegistration);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications:", err);
    }
  };

  const deleteReadNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications", { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !n.read));
      }
    } catch (err) {
      console.error("Error deleting old notifications:", err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    setIsOpen(false);
    setSelectedNotification(n);
    if (!n.read) {
      try {
        await fetch("/api/admin/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
        setNotifications((prev) =>
          prev.map((nf) => (nf.id === n.id ? { ...nf, read: true } : nf))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "NEW_PLAYER":
        return <UserPlus size={16} className="text-green-400" />;
      case "TOURNAMENT_REGISTRATION":
        return <Gamepad2 size={16} className="text-blue-400" />;
      case "PENDING_REGISTRATION":
        return <UserCheck size={16} className="text-yellow-400" />;
      case "ORPHAN_PLAYERS_ALERT":
        return <AlertTriangle size={16} className="text-red-500 animate-pulse" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
    }
  };

  const getRedirectUrl = (notification: Notification) => {
    try {
      if (!notification.data) return "/admin/dashboard";
      
      if (notification.type === "ORPHAN_PLAYERS_ALERT") {
        return "/admin/tournaments";
      }

      const payload = JSON.parse(notification.data);

      switch (notification.type) {
        case "NEW_PLAYER":
          return restrictRegistration ? `/admin/requests?tab=players` : `/admin/players`;
        case "TOURNAMENT_REGISTRATION":
          return `/admin/tournaments`;
        case "PENDING_REGISTRATION":
          return `/admin/requests`;
        default:
          return "/admin/dashboard";
      }
    } catch {
      return "/admin/dashboard";
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell size={20} className="text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">
              Notificaciones {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:text-yellow-300 flex items-center gap-1 transition-colors"
                  title="Marcar todas como leídas"
                >
                  <Check size={12} /> Marcar leídas
                </button>
              )}
              {notifications.some(n => n.read) && (
                <button
                  onClick={deleteReadNotifications}
                  className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                  title="Borrar notificaciones leídas"
                >
                  <Trash2 size={12} /> Borrar vistas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No hay notificaciones
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-start gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${n.read ? "opacity-60" : "bg-white/2"
                    }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{n.title}</p>
                    <p className="text-xs text-gray-400 break-words line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {selectedNotification && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5">
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {selectedNotification.title}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {timeAgo(selectedNotification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedNotification.message}
              </p>
            </div>
            <div className="flex items-center justify-end p-4 border-t border-white/5 gap-3 bg-white/[0.02]">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
              >
                Cerrar
              </button>
              <Link
                href={getRedirectUrl(selectedNotification)}
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-black hover:bg-primary/90 transition-colors"
              >
                Ir a la Sección
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
