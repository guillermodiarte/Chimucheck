"use client";

import { login } from "@/app/actions/auth";
import { useFormStatus } from "react-dom";
import { useState } from "react"; // Ensure useState is imported

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

export default function AdminLogin() {
  // We need to handle the server action response properly.
  // Since useFormState is newer, we can just wrap the action or use a simpler approach for now.
  // For simplicity in this demo, I'll use a basic form submission.

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl border border-white/10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Panel</h1>
        <form action={login} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              type="password"
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
