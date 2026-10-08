'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Layers, Send, Calculator, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Protocol', icon: Activity },
    { href: '/dashboard', label: 'Earner Dashboard', icon: Layers },
    { href: '/pay/BF-001', label: 'Client Pay Link', icon: Send },
    { href: '/simulator', label: 'Settlement Simulator', icon: Calculator },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-navy-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-500 to-brand-glow flex items-center justify-center font-black text-black text-xl shadow-lg shadow-brand-500/20">
            🌊
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              BackFlow <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">Monad</span>
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-brand-400 border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Monad Testnet
          </div>
          <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
            Passkey Active
          </button>
        </div>
      </div>
    </header>
  );
}
