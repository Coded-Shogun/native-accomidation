/**
 * Dashboard Layout Component
 * Main layout wrapper for dashboard pages
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'PROPERTY_MANAGER' | 'FRONT_DESK' | 'STUDENT' | 'GUEST' | 'RESIDENT';
}

export async function DashboardLayout({
  children,
  requiredRole,
}: DashboardLayoutProps) {
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check role authorization
  if (requiredRole && session.user.role !== requiredRole) {
    if (!(session.user.role === 'ADMIN' && requiredRole === 'PROPERTY_MANAGER')) {
      redirect('/unauthorized');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={{
          name: session.user.name || session.user.email || 'User',
          email: session.user.email || '',
          role: session.user.role || 'USER',
        }}
      />
      <div className="flex">
        <Sidebar role={session.user.role as any} />
        <main className="flex-1 pl-64">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
