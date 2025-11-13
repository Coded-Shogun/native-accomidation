/**
 * Registration Page
 * WCAG 2.2 Level AA compliant
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Register - Student Accommodation Management',
  description: 'Create a new student accommodation account',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-nsfas-green/10 via-nsfas-blue/10 to-nsfas-gold/10 px-4 py-12">
      <div className="w-full max-w-2xl">
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

        {/* Registration Card */}
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              Create Account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Register as a new student to access accommodation services
            </p>
          </div>

          {/* NSFAS Eligibility Notice */}
          <div className="mb-6 rounded-md border border-nsfas-green/20 bg-nsfas-green/5 p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl" aria-hidden="true">
                ℹ️
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  NSFAS Eligibility
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  To qualify for NSFAS accommodation funding, you must be
                  registered at a university located at least 20km from your
                  home address. The annual accommodation cap is R45,000.
                </p>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <RegisterForm />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Sign in to your account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            By creating an account, you agree to our{' '}
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
