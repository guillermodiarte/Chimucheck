import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Twitch from "next-auth/providers/twitch";
import Twitter from "next-auth/providers/twitter";
import Facebook from "next-auth/providers/facebook";
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
  // Fix for VPS/HTTP: Only use secure cookies if URL starts with https
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https") ?? false,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_URL?.startsWith("https") ?? false,
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account && account.provider !== "credentials") {
        try {
          const provider = account.provider;
          const providerAccountId = account.providerAccountId;
          const email = user.email ? user.email.toLowerCase().trim() : null;

          // 1. Check if this OAuth account already exists
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider,
                providerAccountId,
              },
            },
            include: { player: true },
          });

          if (existingAccount?.player) {
            const player = existingAccount.player;
            if (player.registrationStatus === "REJECTED") {
              return "/player/login?error=ACCOUNT_DISABLED";
            }

            // Auto-approve OAuth users even if previously pending
            if (!player.active || player.registrationStatus === "PENDING") {
              await db.player.update({
                where: { id: player.id },
                data: { active: true, registrationStatus: "APPROVED" },
              });
              player.active = true;
              player.registrationStatus = "APPROVED";
            }

            // Update avatar if missing in DB
            if (!player.image && user.image) {
              await db.player.update({
                where: { id: player.id },
                data: { image: user.image },
              });
            }

            user.id = player.id;
            (user as any).alias = player.alias;
            (user as any).image = player.image || user.image;
            return true;
          }

          // 2. Check if a player with this email already exists
          if (email) {
            const existingPlayer = await db.player.findUnique({
              where: { email },
            });

            if (existingPlayer) {
              if (existingPlayer.registrationStatus === "REJECTED") {
                return "/player/login?error=ACCOUNT_DISABLED";
              }

              // Auto-approve OAuth users even if previously pending
              if (!existingPlayer.active || existingPlayer.registrationStatus === "PENDING") {
                await db.player.update({
                  where: { id: existingPlayer.id },
                  data: { active: true, registrationStatus: "APPROVED" },
                });
                existingPlayer.active = true;
                existingPlayer.registrationStatus = "APPROVED";
              }

              // Link this OAuth account to existing player
              await db.account.create({
                data: {
                  playerId: existingPlayer.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: (account.session_state as string) || null,
                },
              });

              if (!existingPlayer.image && user.image) {
                await db.player.update({
                  where: { id: existingPlayer.id },
                  data: { image: user.image },
                });
              }

              user.id = existingPlayer.id;
              (user as any).alias = existingPlayer.alias;
              (user as any).image = existingPlayer.image || user.image;
              return true;
            }
          }

          // 3. New player registering via OAuth (always auto-approved since OAuth verifies human identity)
          const finalEmail = email || `${provider}_${providerAccountId}@chimuchek.local`;

          let baseAlias = (
            user.name ||
            (user.email ? user.email.split("@")[0] : null) ||
            `${provider}_player`
          )
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .substring(0, 15);

          if (!baseAlias || baseAlias.length < 2) {
            baseAlias = "Player";
          }

          let uniqueAlias = baseAlias;
          let counter = 1;
          while (await db.player.findUnique({ where: { alias: uniqueAlias } })) {
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            uniqueAlias = `${baseAlias.substring(0, 11)}_${randomSuffix}`;
            counter++;
            if (counter > 10) {
              uniqueAlias = `${baseAlias.substring(0, 8)}_${Date.now().toString().slice(-4)}`;
              break;
            }
          }

          const newPlayer = await db.player.create({
            data: {
              name: user.name || uniqueAlias,
              email: finalEmail,
              alias: uniqueAlias,
              image: user.image,
              active: true,
              registrationStatus: "APPROVED",
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: (account.session_state as string) || null,
                },
              },
              stats: {
                create: {},
              },
            },
          });

          // Admin notification
          try {
            await db.notification.create({
              data: {
                type: "NEW_PLAYER",
                title: "Nuevo Jugador Registrado",
                message: `${uniqueAlias} (${finalEmail}) se ha registrado vía ${provider.toUpperCase()}.`,
                data: JSON.stringify({
                  playerId: newPlayer.id,
                  alias: uniqueAlias,
                  email: finalEmail,
                  provider,
                }),
              },
            });
          } catch (err) {
            console.error("Admin notification error:", err);
          }

          user.id = newPlayer.id;
          (user as any).alias = newPlayer.alias;
          (user as any).image = newPlayer.image;
          return true;
        } catch (error) {
          console.error("OAuth sign in error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in
        token.id = user.id;
        token.alias = (user as any).alias;
        token.image = user.image;
        token.role = "PLAYER";
      }

      // If token exists but has no alias or stale image, verify from DB
      const lookupId = (token.id as string) || token.sub;
      if (lookupId && (!token.alias || !token.id)) {
        try {
          const player = await db.player.findUnique({
            where: { id: lookupId },
            select: { id: true, image: true, alias: true },
          });
          if (player) {
            token.id = player.id;
            token.image = player.image || token.image;
            token.alias = player.alias;
            token.role = "PLAYER";
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
        session.user.id = (token.id as string) || (token.sub as string);
        (session.user as any).alias = token.alias as string;
        (session.user as any).image = token.image as string;
        (session.user as any).role = "PLAYER";
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID || process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET || process.env.DISCORD_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Twitch({
      clientId: process.env.AUTH_TWITCH_ID || process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.AUTH_TWITCH_SECRET || process.env.TWITCH_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID || process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET || process.env.TWITTER_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID || process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET || process.env.FACEBOOK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const player = await getPlayer(email);

          if (!player) {
            console.log("Invalid credentials: User not found");
            return null;
          }

          if (!player.password) {
            console.log("Invalid credentials: Player registered with social login");
            throw new Error("LOGIN_WITH_OAUTH");
          }

          if (!player.active || player.registrationStatus !== "APPROVED") {
            console.log("Invalid credentials: User is not active or not approved");
            throw new Error("ACCESO_DENEGADO");
          }

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
