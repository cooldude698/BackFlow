'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, QrCode, SlidersHorizontal, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isWallet = pathname === '/dashboard';
  const isPay = pathname.startsWith('/pay');
  const isSim = pathname.startsWith('/simulator');
  const isProfile = pathname.startsWith('/profile');

  const navItems = [
    {
      label: 'Wallet',
      href: '/dashboard',
      active: isWallet,
      icon: Wallet
    },
    {
      label: 'Charge',
      href: '/pay/BF-001',
      active: isPay,
      icon: QrCode
    },
    {
      label: 'Simulate',
      href: '/simulator',
      active: isSim,
      icon: SlidersHorizontal
    },
    {
      label: 'Profile',
      href: '/profile',
      active: isProfile,
      icon: User
    }
  ];

  return (
    <nav className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#18181B] border-t-2 border-black dark:border-[#27272A] select-none transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all py-1.5 px-3 rounded-xl ${
                item.active
                  ? 'bg-[#FFC800] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-[#FAF9F5] dark:hover:bg-[#27272A]'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.5} />
              <span className="font-display font-black text-[10px] uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
