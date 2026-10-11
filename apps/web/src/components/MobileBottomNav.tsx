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
    <nav
      className="fixed sm:absolute bottom-0 left-0 right-0 z-40 sm:rounded-b-[2.5rem]"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(28px) saturate(180%)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 -4px 20px -2px rgba(15,23,42,0.05)'
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1 transition-all duration-200 py-1 px-3 rounded-2xl"
            >
              <div
                className="p-1.5 rounded-xl transition-all duration-200"
                style={item.active
                  ? { background: 'rgba(99,102,241,0.12)', color: '#6366f1' }
                  : { color: 'rgba(100,116,139,0.7)' }}
              >
                <Icon className="h-5 w-5" strokeWidth={item.active ? 2.3 : 1.8} />
              </div>
              <span
                className="text-[10px] font-semibold tracking-tight transition-all"
                style={item.active ? { color: '#6366f1', fontWeight: 700 } : { color: '#64748b' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iPhone home indicator */}
      <div className="w-28 h-1 rounded-full mx-auto mb-2" style={{ background: 'rgba(0,0,0,0.18)' }} />
    </nav>
  );
}
