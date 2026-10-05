"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SocialAuthButtonsProps {
  callbackUrl?: string;
  mode?: "login" | "register";
}

export default function SocialAuthButtons({
  callbackUrl = "/player/dashboard",
  mode = "login",
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: string) => {
    try {
      setLoadingProvider(provider);
      await signIn(provider, {
        callbackUrl: callbackUrl || "/player/dashboard",
      });
    } catch (error) {
      console.error(`Error logging in with ${provider}:`, error);
      toast.error(`No se pudo conectar con ${provider}. Inténtalo más tarde.`);
      setLoadingProvider(null);
    }
  };

  const actionText = mode === "register" ? "Registrarse" : "Continuar";

  return (
    <div className="space-y-3 w-full">
      {/* Google: Primary Social Provider */}
      <button
        type="button"
        disabled={loadingProvider !== null}
        onClick={() => handleOAuthSignIn("google")}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 active:scale-[0.99] text-white font-medium text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{actionText} con Google</span>
      </button>

      {/* Grid for X (Twitter) and Facebook */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuthSignIn("twitter")}
          title={`${actionText} con X (Twitter)`}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 hover:border-white/40 hover:text-white text-gray-300 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loadingProvider === "twitter" ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <svg
              className="w-4 h-4 text-white group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          )}
          <span className="text-[10px] mt-1 font-medium text-gray-400 group-hover:text-white">X</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuthSignIn("facebook")}
          title={`${actionText} con Facebook`}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-white/10 bg-white/5 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:text-white text-gray-300 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loadingProvider === "facebook" ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1877F2]" />
          ) : (
            <svg
              className="w-4 h-4 text-[#1877F2] group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          <span className="text-[10px] mt-1 font-medium text-gray-400 group-hover:text-white">Facebook</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center py-2">
        <div className="border-t border-white/10 w-full"></div>
        <span className="bg-zinc-950 px-3 text-[11px] uppercase tracking-wider text-gray-500 shrink-0 font-medium">
          O con tu email
        </span>
        <div className="border-t border-white/10 w-full"></div>
      </div>
    </div>
  );
}
