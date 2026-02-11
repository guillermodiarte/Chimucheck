"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "bcryptjs";

const UserSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
});

export async function getUsers() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}

export async function createUser(prevState: any, formData: FormData) {
  const validatedFields = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Error de validación",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  if (!password) {
    return { success: false, message: "La contraseña es obligatoria para nuevos usuarios." };
  }

  try {
    const hashedPassword = await hash(password, 10);
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        active: true,
      },
    });
    revalidatePath("/admin/settings");
    return { success: true, message: "Usuario creado correctamente" };
  } catch (error) {
    return { success: false, message: "Error al crear usuario. El email podría estar duplicado." };
  }
}

export async function updateUser(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const validatedFields = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Error de validación",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const updateData: any = { name, email };
    if (password) {
      updateData.password = await hash(password, 10);
    }

    await db.user.update({
      where: { id },
      data: updateData,
    });
    revalidatePath("/admin/settings");
    return { success: true, message: "Usuario actualizado correctamente" };
  } catch (error) {
    return { success: false, message: "Error al actualizar usuario." };
  }
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
  try {
    await db.user.update({
      where: { id },
      data: { active: !currentStatus },
    });
    revalidatePath("/admin/settings");
  } catch (error) {
    console.error("Error al cambiar estado del usuario.", error);
  }
}

export async function deleteUser(id: string) {
  try {
    await db.user.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
  } catch (error) {
    console.error("Error al eliminar el usuario.", error);
  }
}
