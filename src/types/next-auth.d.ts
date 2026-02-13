import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      alias?: string;
      role?: string;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    alias?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    alias?: string;
    role?: string;
  }
}
