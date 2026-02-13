import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";

async function getPlayer(email: string) {
  try {
    const player = await db.player.findUnique({ where: { email } });
    return player;
  } catch (error) {
    console.error("Failed to fetch player:", error);
    throw new Error("Failed to fetch player.");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const player = await getPlayer(email);

          if (!player) return null;

          const passwordsMatch = await bcrypt.compare(password, player.password);

          if (passwordsMatch) {
            return {
              id: player.id,
              name: player.name,
              email: player.email,
              image: player.image,
              alias: player.alias,
            };
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
