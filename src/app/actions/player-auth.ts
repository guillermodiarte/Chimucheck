"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getGlobalSettings } from "@/app/actions/settings";

const RegisterSchema = z.object({
  alias: z.string().min(2, "El alias es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().optional(),
});

export async function loginPlayer(prevState: string | undefined, formData: FormData) {
  try {
    const callbackUrl = formData.get("callbackUrl") as string | null;
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: callbackUrl || "/player/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (
        error.type === "CallbackRouteError" ||
        error.message.includes("ACCESO_DENEGADO") ||
        (error.cause?.err as any)?.message === "ACCESO_DENEGADO"
      ) {
        // Because NextAuth wraps custom errors, we check deep inside cause
        if (String((error.cause?.err as any)?.message).includes("ACCESO_DENEGADO") || error.message.includes("ACCESO_DENEGADO")) {
          return "Tu cuenta se encuentra en revisión. Aguarda a que un administrador la apruebe.";
        }
      }

      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salió mal.";
      }
    }

    if (error instanceof Error && error.message.includes("ACCESO_DENEGADO")) {
      return "Tu cuenta se encuentra en revisión. Aguarda a que un administrador la apruebe.";
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
      payload: {
        alias: formData.get("alias"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      }
    };
  }

  const { alias, email, password, phone } = validatedFields.data;

  try {
    const existingEmail = await db.player.findUnique({ where: { email } });
    if (existingEmail) {
      if (existingEmail.registrationStatus === "PENDING") {
        return {
          success: false,
          message: "Tu solicitud de registro está pendiente de aprobación por un administrador.",
          payload: { alias, email, phone }
        };
      }
      if (existingEmail.registrationStatus === "REJECTED") {
        return {
          success: false,
          message: "Tu solicitud de registro ha sido rechazada.",
          payload: { alias, email, phone }
        };
      }

      return {
        success: false,
        message: "El email ya está registrado.",
        payload: { alias, email, phone }
      };
    }

    const existingAlias = await db.player.findUnique({ where: { alias } });
    if (existingAlias) {
      return {
        success: false,
        message: "El alias ya está en uso.",
        payload: { alias, email, phone }
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const settings = await getGlobalSettings();
    const isRestricted = settings?.restrictPlayerRegistration;

    const newPlayer = await db.player.create({
      data: {
        alias,
        email,
        password: hashedPassword,
        phone,
        active: !isRestricted,
        registrationStatus: isRestricted ? "PENDING" : "APPROVED",
      },
    });

    // Create initial empty stats
    await db.playerStats.create({
      data: {
        playerId: newPlayer.id
      }
    });

    // Create notification for admin (non-blocking)
    try {
      await db.notification.create({
        data: {
          type: "NEW_PLAYER",
          title: "Nuevo Jugador Registrado",
          message: `${alias} (${email}) se ha registrado.`,
          data: JSON.stringify({ playerId: newPlayer.id, alias, email }),
        },
      });
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr);
    }

    return {
      success: true,
      message: isRestricted ? "Cuenta en revisión" : "Cuenta creada. Inicia sesión.",
      isPending: isRestricted
    };

  } catch (error) {
    console.error("Player Registration error:", error);
    return {
      success: false,
      message: "Error al crear la cuenta.",
      payload: { alias, email, phone }
    };
  }
}
