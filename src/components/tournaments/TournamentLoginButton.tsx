"use client";

import { Button } from "@/components/ui/button";

export default function TournamentLoginButton() {
  return (
    <Button
      className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold cursor-pointer"
      onClick={() => window.dispatchEvent(new Event("open-login-modal"))}
    >
      Iniciar Sesión
    </Button>
  );
}
