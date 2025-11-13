/**
 * Homepage
 * Landing page with role-based redirects
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Building2, Users, Shield, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Home',
};

export default async function HomePage() {
  const session = await auth();

  // Redirect authenticated users to appropriate dashboard
  if (session?.user) {
    const { role } = session.user;

    if (role === 'admin') {
      redirect('/bursary');
    } else if (role === 'manager') {
      redirect('/properties');
    } else if (role === 'student') {
      redirect('/student');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nsfas-green/10 via-nsfas-blue/10 to-nsfas-gold/10">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-2xl font-bold text-primary">
            🏠 <span>Student Accommodation</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground">
            NSFAS-Compliant Student Accommodation Management
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Streamline your student housing operations with our comprehensive,
            ISO 27001 and SOC 2 compliant management system
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="rounded-md border-2 border-primary px-6 py-3 text-base font-semibold text-primary hover:bg-primary/10"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-nsfas-green/10">
              <Building2 className="h-6 w-6 text-nsfas-green" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Property Management
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage multiple properties, rooms, and facilities with ease
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-nsfas-blue/10">
              <Users className="h-6 w-6 text-nsfas-blue" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Student Portal
            </h3>
            <p className="text-sm text-muted-foreground">
              Self-service portal for students to manage their accommodation
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-nsfas-gold/10">
              <Shield className="h-6 w-6 text-nsfas-gold" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              NSFAS Compliance
            </h3>
            <p className="text-sm text-muted-foreground">
              Full compliance with NSFAS requirements and automated reporting
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Bursary Management
            </h3>
            <p className="text-sm text-muted-foreground">
              Track student funding, compliance, and generate detailed reports
            </p>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="mt-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Trusted & Compliant
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-card px-4 py-2">
              ✓ ISO 27001:2022
            </div>
            <div className="rounded-lg border bg-card px-4 py-2">
              ✓ SOC 2 Type II
            </div>
            <div className="rounded-lg border bg-card px-4 py-2">
              ✓ NSFAS 2025
            </div>
            <div className="rounded-lg border bg-card px-4 py-2">
              ✓ GDPR/POPIA
            </div>
            <div className="rounded-lg border bg-card px-4 py-2">
              ✓ WCAG 2.2 AA
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Student Accommodation Management System</p>
          <p className="mt-2">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>{' '}
            ·{' '}
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>{' '}
            ·{' '}
            <Link href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="hover:underline">
              Support
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
