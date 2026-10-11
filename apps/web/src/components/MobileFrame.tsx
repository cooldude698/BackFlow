'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';
import { getUserProfile, UserProfileDTO } from '@/lib/api';

export default function MobileFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const [profile, setProfile] = useState<UserProfileDTO | null>(null);

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  const earnerName = profile?.name || 'Aman';

  return (
    <div className="min-h-screen bg-[#eef1f6] flex flex-col items-center justify-start sm:justify-center sm:py-6 sm:px-4">
      <div className="w-full sm:max-w-[430px] sm:h-[900px] bg-[#fafafc] sm:border sm:border-slate-300/80 sm:rounded-[3.2rem] shadow-[0_25px_70px_-15px_rgba(100,116,139,0.22)] relative flex flex-col overflow-hidden sm:ring-1 sm:ring-black/5">

        {/* Ambient glow on desktop */}
        <div
          className="hidden sm:block absolute -inset-8 rounded-[4rem] pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 65%)' }}
        />

        {/* iOS Status Bar */}
        <div
          className="relative z-30 pt-3.5 px-7 flex items-center justify-between text-[12px] font-semibold select-none flex-shrink-0"
          style={{ background: 'rgba(250,250,252,0.92)', backdropFilter: 'blur(20px)' }}
        >
          <span className="text-slate-900 tracking-tight font-bold">9:41</span>

          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] mono shadow-xs"
            style={{ background: '#ffffff', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            <span style={{ color: '#6366f1', fontWeight: 700 }}>BackFlow • Monad</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Signal className="h-3.5 w-3.5" />
            <Wifi className="h-3.5 w-3.5" />
            <BatteryMedium className="h-4 w-4" />
          </div>
        </div>

        {/* Header: Distinct for Login vs Portal */}
        {isLoginPage ? (
          <header
            className="relative z-20 px-5 pt-3.5 pb-3 flex items-center justify-between border-b flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)', borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-base shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', boxShadow: '0 3px 12px rgba(99,102,241,0.3)' }}
              >
                🌊
              </div>
              <div>
                <div className="text-[14px] font-extrabold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                  BackFlow
                  <span className="badge-periwinkle" style={{ fontSize: '9px' }}>Login</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Earner Verification & Rail Setup
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] mono shadow-xs"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span className="text-slate-600 font-medium">Secure Step</span>
            </div>
          </header>
        ) : (
          <header
            className="relative z-20 px-5 pt-2.5 pb-3 flex items-center justify-between border-b flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)', borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-base shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', boxShadow: '0 3px 12px rgba(99,102,241,0.3)' }}
              >
                🌊
              </div>
              <div>
                <div className="text-[14px] font-extrabold text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                  BackFlow
                  <span className="badge-periwinkle" style={{ fontSize: '9px' }}>Portal</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Auto-Split Consumer Rail</div>
              </div>
            </Link>

            {/* Earner Status Badge (Links to Profile tab) */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] shadow-xs hover:bg-slate-50 transition-colors"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}
              title="User Profile & Payout Details"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: '#10b981' }} />
              <span className="font-semibold text-slate-800">{earnerName}</span>
            </Link>
          </header>
        )}

        {/* Scrollable content */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-4 text-slate-900 ${
            isLoginPage ? 'pb-8 flex flex-col justify-center' : 'pb-32'
          }`}
        >
          {children}
        </div>

        {/* Fixed Mobile Bottom Navigation - only inside portal, not on login */}
        {!isLoginPage && <MobileBottomNav />}
      </div>
    </div>
  );
}
