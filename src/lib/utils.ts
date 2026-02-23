import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to DD/MM/YYYY
 * Use this everywhere instead of toLocaleDateString() to ensure consistent format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date to DD/MM/YYYY HH:mm
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Normalizes a social link entry from the DB
 */
export function getSocialConfig(socials: any, key: string): { url: string; active: boolean } {
  const data = socials?.[key];
  if (!data) return { url: '', active: false };
  if (typeof data === 'string') return { url: data, active: data.trim() !== '' };
  return { url: data.url || '', active: !!data.active && (data.url || '').trim() !== '' };
}
