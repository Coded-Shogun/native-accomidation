/**
 * Header Component
 * Top navigation bar with user menu
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    // Client-side sign out
    window.location.href = '/api/auth/signout';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nsfas-green">
              <span className="text-lg font-bold text-white">SA</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              Student Accommodation
            </span>
          </Link>

          {/* Breadcrumb navigation */}
          <nav className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
            <span className="capitalize">
              {pathname.split('/')[1] || 'Home'}
            </span>
          </nav>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {user.role}
            </span>
          </div>

          {/* User Menu */}
          <Select defaultValue="profile">
            <SelectTrigger className="w-[140px]">
              <User className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </SelectItem>
              <SelectItem value="settings">
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </SelectItem>
              <SelectItem value="signout">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
