"use client";

import { login } from "@/app/actions/auth";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PasswordInput } from "@/components/ui/password-input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary text-black font-bold py-2 px-4 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
    >
      {pending ? "Entrando..." : "Ingresar"}
    </button>
  );
}

const initialState = {
  error: "",
};

export default function AdminLogin() {
  // Use useActionState to handle the server action result
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl border border-white/10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Panel</h1>

        {state?.error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4 text-sm text-center">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-secondary transition-colors"
              placeholder="admin@chimuchek.com"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
              Contraseña
            </label>
            <PasswordInput
              name="password"
              id="password"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded py-2 px-3 focus:outline-none focus:border-secondary transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
