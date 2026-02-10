"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export async function login(prevState: any, formData: FormData) {
  const password = formData.get("password");

  if (password === PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    redirect("/admin/dashboard");
  } else {
    return { error: "Contraseña incorrecta" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin");
}
