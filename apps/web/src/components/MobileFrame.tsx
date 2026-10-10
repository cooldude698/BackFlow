'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Wifi, BatteryMedium, Signal, ShieldCheck } from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';

export default function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start sm:justify-center sm:py-6 sm:px-4">
      {/* Phone container */}
      <div className="w-full sm:max-w-[430px] sm:h-[890px] bg-black sm:border sm:border-neutral-800/80 sm:rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden sm:ring-1 sm:ring-white/10">
        
        {/* iOS Dynamic Island & Status Bar */}
        <div className="pt-3 px-7 flex items-center justify-between text-xs text-slate-300 font-semibold select-none flex-shrink-0 z-30 bg-black/60 backdrop-blur-md">
          <span>9:41</span>

          {/* Dynamic Island Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-[#0d0d12] border border-white/10 rounded-full px-3 py-1 text-[11px] font-mono text-periwinkle shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BackFlow • Monad</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="h-3.5 w-3.5 text-white" />
            <Wifi className="h-3.5 w-3.5 text-white" />
            <BatteryMedium className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Top App Header */}
        <header className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0 z-20 bg-black/80 backdrop-blur-lg">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-periwinkle to-periwinkle-glow flex items-center justify-center font-black text-black text-base shadow-md shadow-periwinkle/20">
              🌊
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-tight leading-none flex items-center gap-1.5">
                BackFlow
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-periwinkle/15 text-periwinkle border border-periwinkle/30 font-bold">
                  App
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                Auto-Split Consumer Rail
              </div>
            </div>
          </Link>

          {/* Earner Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#121218] border border-white/10 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-slate-200">Rahul</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Mobile Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 text-white space-y-4">
          {children}
        </div>

        {/* Fixed Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
