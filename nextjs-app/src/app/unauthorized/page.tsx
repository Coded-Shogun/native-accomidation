/**
 * Unauthorized Access Page
 * Displayed when user doesn't have permission to access a resource
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Unauthorized Access',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-destructive/10 to-muted/20 px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-10 w-10 text-destructive" aria-hidden="true" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          Access Denied
        </h1>

        {/* Description */}
        <p className="mb-8 text-lg text-muted-foreground">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is a mistake.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go to Homepage
          </Link>
          <Link
            href="/login"
            className="rounded-md border-2 border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Sign In Again
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 rounded-md border border-muted bg-muted/50 p-4 text-left text-sm">
          <p className="mb-2 font-semibold text-foreground">
            Need help?
          </p>
          <p className="text-muted-foreground">
            Contact support at{' '}
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
              className="font-medium text-primary hover:underline"
            >
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
