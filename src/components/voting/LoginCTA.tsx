"use client";

export function LoginCTABanner() {
  return (
    <div className="bg-gradient-to-r from-secondary/10 to-purple-500/10 border border-secondary/30 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="space-y-1">
        <p className="text-white font-bold text-lg">¿Querés votar?</p>
        <p className="text-gray-300 text-sm">
          Iniciá sesión con tu cuenta de ChimuCheck para votar por tus imágenes favoritas.
        </p>
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
        className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-secondary text-black font-black text-sm hover:bg-yellow-400 transition-all"
      >
        Iniciar Sesión
      </button>
    </div>
  );
}

export function GalleryLoginHint() {
  return (
    <p className="text-gray-400 text-sm text-center">
      Podés ver todas las imágenes, pero necesitás{" "}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
        className="text-secondary underline cursor-pointer font-semibold hover:text-yellow-400 transition-colors"
      >
        iniciar sesión
      </button>{" "}
      para votar.
    </p>
  );
}
