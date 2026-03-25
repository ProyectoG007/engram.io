// ============================================
// CAPA 2: AUTENTICACIÓN Y SEGURIDAD
// NextAuth Configuration
// ============================================

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/prisma";
import { AIProviders } from "@/lib/ai-providers";

export const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
] as Provider[];

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        
        // Obtener rol y plan del usuario
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, plan: true },
        });
        
        session.user.role = dbUser?.role || "USER";
        session.user.plan = dbUser?.plan || "FREE";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_CREATED",
          entity: "User",
          entityId: user.id,
          details: { email: user.email },
        },
      });
    },
  },
});

// Extender tipos
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "USER" | "ADMIN" | "CTO";
      plan: "FREE" | "PRO" | "ENTERPRISE";
    };
  }
}
