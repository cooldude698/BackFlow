'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, QrCode, SlidersHorizontal, UserCheck } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '/dashboard';
  const isPay = pathname.startsWith('/pay');
  const isSim = pathname.startsWith('/simulator');
  const isAccount = pathname.startsWith('/login');

  const navItems = [
    {
      label: 'Wallet',
      href: '/dashboard',
      active: isHome,
      icon: Wallet
    },
    {
      label: 'Charge',
      href: '/pay/BF-001',
      active: isPay,
      icon: QrCode
    },
    {
      label: 'Payout Rail',
      href: '/login',
      active: isAccount,
      icon: UserCheck
    },
    {
      label: 'Simulate',
      href: '/simulator',
      active: isSim,
      icon: SlidersHorizontal
    }
  ];

  return (
    <nav className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bottom-nav-blur border-t border-white/10 px-4 py-2 sm:rounded-b-[2.5rem]">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 rounded-xl ${
                item.active
                  ? 'text-periwinkle scale-105 font-bold'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  item.active ? 'bg-periwinkle/15 text-periwinkle' : 'bg-transparent'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Home indicator bar (iPhone gesture bar) */}
      <div className="w-28 h-1 bg-white/20 rounded-full mx-auto mt-1.5"></div>
    </nav>
  );
}
