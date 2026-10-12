'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wifi, BatteryMedium, Signal, Sun, Moon } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';
import { getUserProfile, UserProfileDTO } from '@/lib/api';
import { useLoginStep } from '../context/LoginStepContext';
import { useTheme } from '../context/ThemeContext';

export default function MobileFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { step: loginStep } = useLoginStep();
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<UserProfileDTO | null>(null);

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  const earnerName = profile?.name || 'Aman';

  return (
    <div className="min-h-screen bg-[#EBEBE5] dark:bg-[#09090C] flex flex-col items-center justify-start sm:justify-center sm:py-4 sm:px-4 transition-colors duration-200">
      <div className="w-full sm:max-w-[430px] h-screen sm:h-[min(880px,94vh)] bg-[#FAF9F5] dark:bg-[#121214] sm:border-[2.5px] sm:border-black dark:sm:border-[#FFC800] sm:rounded-[2.5rem] sm:shadow-[8px_8px_0px_#000000] dark:sm:shadow-[8px_8px_0px_#FFC800] relative flex flex-col overflow-hidden transition-all">

        {/* iOS Status Bar */}
        <div className="relative z-30 pt-3 px-5 pb-2.5 flex items-center justify-between text-[12px] font-mono font-bold border-b-2 border-black dark:border-[#27272A] bg-white dark:bg-[#18181B] select-none flex-shrink-0 transition-colors">
          <span className="text-black dark:text-white font-black tracking-tight">9:41</span>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-[#FFC800] border-1.5 border-black text-black shadow-[1.5px_1.5px_0px_#000]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse border border-black" />
              <span>BackFlow • Monad</span>
            </div>

            {/* Dark Mode Toggle Pill */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-6 w-6 rounded-md bg-white dark:bg-[#27272A] border-1.5 border-black dark:border-[#FFC800] shadow-[1.5px_1.5px_0px_#000] dark:shadow-[1.5px_1.5px_0px_#FFC800] flex items-center justify-center text-black dark:text-[#FFC800] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-3.5 w-3.5 fill-black stroke-black pointer-events-none" />
              ) : (
                <Sun className="h-3.5 w-3.5 fill-[#FFC800] stroke-[#FFC800] pointer-events-none" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-black dark:text-white">
            <Signal className="h-3.5 w-3.5" strokeWidth={2.5} />
            <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
            <BatteryMedium className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>

        {/* Header: Distinct for Login vs Portal */}
        {isLoginPage ? (
          <header className="relative z-20 px-4 pt-3 pb-3 flex items-center justify-between border-b-2 border-black dark:border-[#27272A] bg-white dark:bg-[#18181B] flex-shrink-0 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border-2 border-black dark:border-[#FFC800] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] bg-white flex items-center justify-center flex-shrink-0 p-0.5">
                <img
                  src="/logo.jpeg"
                  alt="BackFlow"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-display text-[15px] font-black text-black dark:text-white uppercase tracking-tight leading-none flex items-center gap-1.5">
                  BackFlow
                  <span className="badge-periwinkle" style={{ fontSize: '8.5px', padding: '1px 6px' }}>LOGIN</span>
                </div>
                <div className="text-[9.5px] text-black/70 dark:text-white/70 font-bold uppercase tracking-wider mt-1">
                  Earner Verification &amp; Rail Setup
                </div>
              </div>
            </div>

            <div className="badge-periwinkle font-mono text-[10px] px-2.5 py-1">
              Step {loginStep} of 3
            </div>
          </header>
        ) : (
          <header className="relative z-20 px-4 pt-3 pb-3 flex items-center justify-between border-b-2 border-black dark:border-[#27272A] bg-white dark:bg-[#18181B] flex-shrink-0 transition-colors">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border-2 border-black dark:border-[#FFC800] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] bg-white flex items-center justify-center flex-shrink-0 p-0.5">
                <img
                  src="/logo.jpeg"
                  alt="BackFlow"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-display text-[15px] font-black text-black dark:text-white uppercase tracking-tight leading-none flex items-center gap-1.5">
                  BackFlow
                  <span className="badge-periwinkle" style={{ fontSize: '8.5px', padding: '1px 6px' }}>PORTAL</span>
                </div>
                <div className="text-[9.5px] text-black/70 dark:text-white/70 font-bold uppercase tracking-wider mt-1">
                  Auto-Split Consumer Rail
                </div>
              </div>
            </Link>

            {/* Earner Status Badge (Links to Profile tab) */}
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border-1.5 border-black dark:border-black shadow-[1.5px_1.5px_0px_#000] bg-[#FFC800] text-black hover:bg-[#FFD21A] transition-all font-display font-black uppercase"
                title="User Profile & Payout Details"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 border border-black" />
                <span>{earnerName}</span>
              </Link>
            </div>
          </header>
        )}

        {/* Scrollable content container with smooth scrolling */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-4 text-black dark:text-white bg-[#FAF9F5] dark:bg-[#121214] transition-colors ${
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
