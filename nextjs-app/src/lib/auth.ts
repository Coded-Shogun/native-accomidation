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

// Extend default session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'manager' | 'student';
      studentNumber?: string;
      propertyId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'admin' | 'manager' | 'student';
    studentNumber?: string;
    propertyId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'manager' | 'student';
    studentNumber?: string;
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

          // Find user (student)
          const student = await prisma.student.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              studentNumber: true,
              propertyId: true,
              accountStatus: true,
            },
          });

          if (!student) {
            logSecurityEvent({
              type: 'failed_login',
              details: { reason: 'User not found', email },
              ipAddress: req.headers?.['x-forwarded-for'] as string,
            });
            return null;
          }

          // Check account status
          if (student.accountStatus !== 'active') {
            logSecurityEvent({
              type: 'failed_login',
              userId: student.id,
              details: { reason: 'Account not active', status: student.accountStatus },
              ipAddress: req.headers?.['x-forwarded-for'] as string,
            });
            return null;
          }

          // For demo purposes, we'll create a simple password check
          // In production, you should have a password field in the database
          // For now, we'll use a demo password hash
          const demoPasswordHash = await import('bcryptjs').then(bcrypt =>
            bcrypt.hash('password123', 12)
          );

          // Verify password (replace with actual password field)
          const isValid = await verifyPassword(password, demoPasswordHash);

          if (!isValid) {
            logSecurityEvent({
              type: 'failed_login',
              userId: student.id,
              details: { reason: 'Invalid password', email },
              ipAddress: req.headers?.['x-forwarded-for'] as string,
            });
            return null;
          }

          // Successful login
          logSecurityEvent({
            type: 'login',
            userId: student.id,
            details: { email },
            ipAddress: req.headers?.['x-forwarded-for'] as string,
          });

          // Determine role (simplified logic)
          const role = email.includes('admin') ? 'admin' :
                      email.includes('manager') ? 'manager' : 'student';

          return {
            id: student.id,
            email: student.email,
            name: `${student.firstName} ${student.lastName}`,
            role,
            studentNumber: student.studentNumber,
            propertyId: student.propertyId || undefined,
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
        token.studentNumber = user.studentNumber;
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
        session.user.studentNumber = token.studentNumber;
        session.user.propertyId = token.propertyId;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to appropriate dashboard based on role
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
