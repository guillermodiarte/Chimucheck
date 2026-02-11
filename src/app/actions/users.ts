"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";

const UserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
});

export async function getUsers() {
  return await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function createUser(prevState: any, formData: FormData) {
  const validatedFields = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { name, email, password } = validatedFields.data;

  if (!password) {
    return { message: "La contraseña es obligatoria para nuevos usuarios." };
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { message: "El email ya está registrado." };
    }

    const hashedPassword = await hash(password, 12);

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    revalidatePath("/admin/settings");
    return { message: "Usuario creado exitosamente", success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { message: "Error al crear el usuario." };
  }
}

export async function updateUser(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;

  // We relax password requirement for updates
  const validatedFields = UserSchema.extend({
    password: z.string().optional()
  }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined, // Send undefined if empty string
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Error en los campos del formulario",
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const dataToUpdate: any = { name, email };
    if (password && password.length >= 6) {
      dataToUpdate.password = await hash(password, 12);
    }

    await db.user.update({
      where: { id },
      data: dataToUpdate,
    });
    revalidatePath("/admin/settings");
    return { message: "Usuario actualizado exitosamente", success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return { message: "Error al actualizar el usuario." };
  }
}

export async function deleteUser(id: string) {
  try {
    // Prevent deleting the last admin or yourself strictly? 
    // For now simple delete.
    await db.user.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
  } catch (error) {
    console.error("Delete user error:", error);
  }
}
