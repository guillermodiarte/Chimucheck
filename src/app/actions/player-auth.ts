"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  alias: z.string().min(2, "El alias es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().optional(),
});

export async function loginPlayer(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: "/player/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salió mal.";
      }
    }
    throw error;
  }
}

export async function logoutPlayer() {
  await signOut({ redirectTo: "/player/login" });
}

export async function registerPlayer(prevState: any, formData: FormData) {
  const validatedFields = RegisterSchema.safeParse({
    alias: formData.get("alias"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Campos inválidos",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { alias, email, password, phone } = validatedFields.data;

  try {
    const existingEmail = await db.player.findUnique({ where: { email } });
    if (existingEmail) {
      return { success: false, message: "El email ya está registrado." };
    }

    const existingAlias = await db.player.findUnique({ where: { alias } });
    if (existingAlias) {
      return { success: false, message: "El alias ya está en uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPlayer = await db.player.create({
      data: {
        alias,
        email,
        password: hashedPassword,
        phone,
        // Active by default for MVP, or verify email later
      },
    });

    // Create initial empty stats
    await db.playerStats.create({
      data: {
        playerId: newPlayer.id
      }
    });

    return { success: true, message: "Cuenta creada. Inicia sesión." };

  } catch (error) {
    console.error("Player Registration error:", error);
    return { success: false, message: "Error al crear la cuenta." };
  }
}
