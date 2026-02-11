"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" };
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Credenciales inválidas" };
    }

    const passwordsMatch = await compare(password, user.password);

    if (!passwordsMatch) {
      return { error: "Credenciales inválidas" };
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", { // In a real app, sign a JWT with user info
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    redirect("/admin/dashboard");
  } catch (error) {
    if ((error as any).message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login error:", error);
    return { error: "Error al iniciar sesión" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin");
}
