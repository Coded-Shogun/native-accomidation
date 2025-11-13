/**
 * Sidebar Component
 * Side navigation menu for dashboard
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  DoorOpen,
  FileText,
  Wrench,
  MessageSquare,
  DollarSign,
  Package,
  ShoppingCart,
  CalendarDays,
  UserCheck,
  Bell,
  Home,
  Settings,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: 'admin' | 'manager' | 'student';
}

const managementLinks = [
  {
    title: 'Dashboard',
    href: '/management',
    icon: LayoutDashboard,
  },
  {
    title: 'Properties',
    href: '/management/properties',
    icon: Building2,
  },
  {
    title: 'Students',
    href: '/management/students',
    icon: Users,
  },
  {
    title: 'Rooms',
    href: '/management/rooms',
    icon: DoorOpen,
  },
  {
    title: 'Leases',
    href: '/management/leases',
    icon: FileText,
  },
  {
    title: 'Bursaries',
    href: '/management/bursaries',
    icon: DollarSign,
  },
  {
    title: 'Maintenance',
    href: '/management/maintenance',
    icon: Wrench,
  },
  {
    title: 'Complaints',
    href: '/management/complaints',
    icon: MessageSquare,
  },
  {
    title: 'Reports',
    href: '/management/reports',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/management/settings',
    icon: Settings,
  },
];

const studentLinks = [
  {
    title: 'Dashboard',
    href: '/student',
    icon: Home,
  },
  {
    title: 'My Accommodation',
    href: '/student/accommodation',
    icon: Building2,
  },
  {
    title: 'Notices',
    href: '/student/notices',
    icon: Bell,
  },
  {
    title: 'Maintenance',
    href: '/student/maintenance',
    icon: Wrench,
  },
  {
    title: 'Laundry',
    href: '/student/laundry',
    icon: CalendarDays,
  },
  {
    title: 'Visitors',
    href: '/student/visitors',
    icon: UserCheck,
  },
  {
    title: 'Complaints',
    href: '/student/complaints',
    icon: MessageSquare,
  },
  {
    title: 'Kiosk',
    href: '/student/kiosk',
    icon: ShoppingCart,
  },
  {
    title: 'Deliveries',
    href: '/student/deliveries',
    icon: Package,
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === 'student' ? studentLinks : managementLinks;

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-background">
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
