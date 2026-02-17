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
  trustHost: true,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in
        token.id = user.id;
        token.alias = (user as any).alias;
        token.image = user.image;
        token.role = "PLAYER";
      } else if (!token.image && token.sub) {
        // If token exists but has no image (stale session), fetch it from DB
        try {
          const player = await db.player.findUnique({
            where: { id: token.sub },
            select: { image: true, alias: true }
          });
          if (player) {
            token.image = player.image;
            token.alias = player.alias; // Also refresh alias while we are at it
          }
        } catch (error) {
          console.error("Error refreshing token user data:", error);
        }
      }

      // Handle updates via update() method if needed
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string; // or token.sub
        (session.user as any).alias = token.alias as string;
        (session.user as any).image = token.image as string;
        (session.user as any).role = "PLAYER";
      }
      return session;
    }
  },
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
              alias: player.alias || undefined,
              name: player.name,
              email: player.email,
              image: player.image,
            };
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
