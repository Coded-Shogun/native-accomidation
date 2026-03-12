/**
 * NextAuth.js v5 Configuration
 * Implements JWT-based authentication with role-based access control
 */

import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/security';
import { logSecurityEvent } from '@/lib/logger';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';

// Extend default session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      studentProfileId?: string;
      propertyId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    studentProfileId?: string;
    propertyId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    studentProfileId?: string;
    propertyId?: string;
  }
}

// Login schema validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          // Validate input
          const result = loginSchema.safeParse(credentials);
          if (!result.success) {
            logSecurityEvent({
              type: 'failed_login',
              details: { reason: 'Invalid input', email: credentials?.email },
              ipAddress: req.headers?.['x-forwarded-for'] as string,
            });
            return null;
          }

          const { email, password } = result.data;

          // Find user
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              studentProfile: {
                select: {
                  id: true,
                  studentNumber: true,
                  accountStatus: true,
                  propertyId: true,
                },
              },
            },
          });

          if (!user) {
            logSecurityEvent({
              type: 'failed_login',
              details: { reason: 'User not found', email },
              ipAddress: req.headers?.['x-forwarded-for'] as string,
            });
            return null;
          }

          // Check account status (for students) or generic status for other roles
          const accountStatus =
            user.studentProfile?.accountStatus ?? user.status ?? 'active';
          if (accountStatus !== 'active') {
            logSecurityEvent({
              type: 'failed_login',
              userId: user.id,
              details: { reason: 'Account not active', status: accountStatus },
              ipAddress: req.headers?.['x-forwarded-for'] as string,
            });
            return null;
          }

          // For demo purposes, we'll create a simple password check
          // In production, you should have a password field in the database
          // For now, we'll use a demo password hash
          const passwordHash = user.passwordHash;
          const isValid = passwordHash
            ? await verifyPassword(password, passwordHash)
            : false;

          if (!isValid) {
            logSecurityEvent({
              type: 'failed_login',
              userId: user.id,
              details: { reason: 'Invalid password', email },
              ipAddress: req.headers?.['x-forwarded-for'] as string,
            });
            return null;
          }

          // Successful login
          logSecurityEvent({
            type: 'login',
            userId: user.id,
            details: { email },
            ipAddress: req.headers?.['x-forwarded-for'] as string,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            studentProfileId: user.studentProfile?.id,
            propertyId: user.studentProfile?.propertyId ?? user.propertyId ?? undefined,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.studentProfileId = user.studentProfileId;
        token.propertyId = user.propertyId;
      }

      // Update session
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.studentProfileId = token.studentProfileId;
        session.user.propertyId = token.propertyId;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Preserve explicit callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        logSecurityEvent({
          type: 'logout',
          userId: token.id as string,
          details: { email: token.email },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
