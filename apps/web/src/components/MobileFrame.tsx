'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';
import { getUserProfile, UserProfileDTO } from '@/lib/api';
import { useLoginStep } from '../context/LoginStepContext';

export default function MobileFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { step: loginStep } = useLoginStep();

  const [profile, setProfile] = useState<UserProfileDTO | null>(null);

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  const earnerName = profile?.name || 'Aman';

  return (
    <div className="min-h-screen bg-[#EBEBE5] flex flex-col items-center justify-start sm:justify-center sm:py-6 sm:px-4">
      <div className="w-full sm:max-w-[430px] sm:h-[900px] bg-[#FAF9F5] sm:border-[2.5px] sm:border-black sm:rounded-[2.5rem] sm:shadow-[8px_8px_0px_#000000] relative flex flex-col overflow-hidden">

        {/* iOS Status Bar */}
        <div className="relative z-30 pt-3 px-6 pb-2.5 flex items-center justify-between text-[12px] font-mono font-bold border-b-2 border-black bg-white select-none flex-shrink-0">
          <span className="text-black font-black tracking-tight">9:41</span>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-[#FFC800] border-1.5 border-black shadow-[1.5px_1.5px_0px_#000]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse border border-black" />
            <span className="text-black">BackFlow • Monad</span>
          </div>

          <div className="flex items-center gap-1.5 text-black">
            <Signal className="h-3.5 w-3.5" strokeWidth={2.5} />
            <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
            <BatteryMedium className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>

        {/* Header: Distinct for Login vs Portal */}
        {isLoginPage ? (
          <header className="relative z-20 px-4 pt-3 pb-3 flex items-center justify-between border-b-2 border-black bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_#000] bg-white flex items-center justify-center flex-shrink-0 p-0.5">
                <img
                  src="/logo.jpeg"
                  alt="BackFlow"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-display text-[15px] font-black text-black uppercase tracking-tight leading-none flex items-center gap-1.5">
                  BackFlow
                  <span className="badge-periwinkle" style={{ fontSize: '8.5px', padding: '1px 6px' }}>LOGIN</span>
                </div>
                <div className="text-[9.5px] text-black/70 font-bold uppercase tracking-wider mt-1">
                  Earner Verification & Rail Setup
                </div>
              </div>
            </div>

            <div className="badge-periwinkle font-mono text-[10px] px-2.5 py-1">
              Step {loginStep} of 3
            </div>
          </header>
        ) : (
          <header className="relative z-20 px-4 pt-3 pb-3 flex items-center justify-between border-b-2 border-black bg-white flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_#000] bg-white flex items-center justify-center flex-shrink-0 p-0.5">
                <img
                  src="/logo.jpeg"
                  alt="BackFlow"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-display text-[15px] font-black text-black uppercase tracking-tight leading-none flex items-center gap-1.5">
                  BackFlow
                  <span className="badge-periwinkle" style={{ fontSize: '8.5px', padding: '1px 6px' }}>PORTAL</span>
                </div>
                <div className="text-[9.5px] text-black/70 font-bold uppercase tracking-wider mt-1">Auto-Split Consumer Rail</div>
              </div>
            </Link>

            {/* Earner Status Badge (Links to Profile tab) */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border-1.5 border-black shadow-[1.5px_1.5px_0px_#000] bg-[#FFC800] text-black hover:bg-[#FFD21A] transition-all font-display font-black uppercase"
              title="User Profile & Payout Details"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 border border-black" />
              <span>{earnerName}</span>
            </Link>
          </header>
        )}

        {/* Scrollable content */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-4 text-black bg-[#FAF9F5] ${
            isLoginPage ? 'pb-8 flex flex-col' : 'pb-28'
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
