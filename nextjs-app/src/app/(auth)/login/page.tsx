/**
 * Login Page
 * WCAG 2.2 Level AA compliant
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login - Student Accommodation Management',
  description: 'Sign in to your student accommodation account',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl = searchParams.callbackUrl || '/';
  const error = searchParams.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-nsfas-green/10 via-nsfas-blue/10 to-nsfas-gold/10 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground">
              🏠
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Student Accommodation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            NSFAS-Compliant Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              Sign In
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              <strong className="font-semibold">Authentication failed.</strong>
              <p className="mt-1">
                {error === 'CredentialsSignin'
                  ? 'Invalid email or password. Please try again.'
                  : 'An error occurred. Please try again later.'}
              </p>
            </div>
          )}

          {/* Login Form */}
          <LoginForm callbackUrl={callbackUrl} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                New to the system?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link
              href="/register"
              className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Create a new account
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 rounded-md border border-muted bg-muted/50 p-4 text-xs">
          <p className="mb-2 font-semibold text-muted-foreground">
            Demo Credentials:
          </p>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <strong>Admin:</strong> admin@example.com / password123
            </li>
            <li>
              <strong>Manager:</strong> manager@example.com / password123
            </li>
            <li>
              <strong>Student:</strong> student@example.com / password123
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
          <p className="mt-2">© 2025 Student Accommodation Management</p>
          <p className="mt-1">ISO 27001 & SOC 2 Compliant</p>
        </div>
      </div>
    </div>
  );
}
