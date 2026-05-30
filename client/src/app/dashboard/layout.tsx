'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import type { AuthUser } from '@/types';

const NAV = [
  { href: '/dashboard/sales', label: 'Sales', roles: ['sales', 'admin'] },
  { href: '/dashboard/sanction', label: 'Sanction', roles: ['sanction', 'admin'] },
  { href: '/dashboard/disbursement', label: 'Disbursement', roles: ['disbursement', 'admin'] },
  { href: '/dashboard/collection', label: 'Collection', roles: ['collection', 'admin'] },
];

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user] = useState<AuthUser | null>(getStoredUser);

  const visibleLinks = NAV.filter((item) => user && item.roles.includes(user.role));

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('role');
    localStorage.clear();
    router.push('/login');
  };

  const Sidebar = () => (
    <aside className="flex flex-col w-60 bg-gray-900 text-white h-full">
      <div className="px-5 py-5 border-b border-gray-800">
        <p className="text-base font-bold tracking-tight">LMS</p>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role ?? ''} Portal</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleLinks.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        {user && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar (slide-in) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex flex-col w-60 transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="text-sm font-bold text-gray-900">LMS</span>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
