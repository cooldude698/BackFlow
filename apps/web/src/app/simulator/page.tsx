'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { relayPayment, dollarsToMicro } from '@/lib/api';
import { triggerConfetti } from '@/lib/confetti';

export default function MobileSimulatorPage() {
  const [grossPayment, setGrossPayment] = useState<number>(1000);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  const earnerPayout = grossPayment * 0.9;
  const backerPayout = grossPayment * 0.1;
  const amanShare  = backerPayout * 0.2;
  const priyaShare = backerPayout * 0.3;
  const karanShare = backerPayout * 0.5;

  const handleBroadcast = async () => {
    setBroadcasting(true);
    setBroadcastDone(false);
    try {
      await relayPayment('BF-001', dollarsToMicro(grossPayment));
      setBroadcastDone(true);
      triggerConfetti();
    } catch (e: any) {
      alert(`Simulation broadcast: ${e.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  const backers = [
    { name: 'Aman',  share: 20, amount: amanShare },
    { name: 'Priya', share: 30, amount: priyaShare },
    { name: 'Karan', share: 50, amount: karanShare },
  ];

  return (
    <div className="space-y-3.5 pb-4">
      {/* Top bar */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/dashboard"
          className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#27272A] border-2 border-black dark:border-white/30 shadow-[2px_2px_0px_#000] flex items-center gap-1 font-display font-black text-black dark:text-white text-[11px] uppercase hover:bg-[#FFC800] dark:hover:bg-[#FFC800] dark:hover:text-black transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={3} />
          Back
        </Link>
        <span className="badge-periwinkle">MATH SIMULATOR</span>
      </div>

      {/* Simulator Card */}
      <div className="app-card-highlight p-5 space-y-4 relative overflow-hidden">
        {/* Decorative corner dot grid & yellow square */}
        <div className="absolute top-3 right-3 w-8 h-8 dot-grid opacity-60 pointer-events-none" />
        <div className="w-3 h-3 bg-[#FFC800] border-1.5 border-black absolute left-3 top-3" />

        <div className="pt-1">
          <div className="label-caps mb-0.5" style={{ fontSize: '10px' }}>INTERACTIVE CALCULATOR</div>
          <h2 className="font-display text-xl font-black uppercase text-black dark:text-white leading-tight">
            HOW ANY PAYMENT SPLITS
          </h2>
          <p className="text-xs text-black/70 dark:text-white/70 font-medium mt-1">
            Slide or pick any payment amount to preview the instantaneous 90/10 math.
          </p>
        </div>

        {/* Amount control */}
        <div className="inset-card p-4 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="label-caps" style={{ fontSize: '9.5px' }}>CLIENT PAYMENT</span>
            <span className="font-display font-black text-2xl text-black dark:text-white">
              ${grossPayment.toLocaleString()}
              <span className="text-xs font-mono font-black ml-1.5 text-black bg-[#FFC800] px-1 py-0.2 border border-black rounded">
                USDC
              </span>
            </span>
          </div>

          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={grossPayment}
            onChange={(e) => setGrossPayment(Number(e.target.value))}
            className="w-full accent-black cursor-pointer"
          />

          <div className="flex justify-between gap-1.5">
            {[500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setGrossPayment(preset)}
                className={`flex-1 py-1 text-xs font-mono font-black rounded-lg border-2 border-black dark:border-white/30 transition-all ${
                  grossPayment === preset
                    ? 'bg-[#FFC800] text-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white dark:bg-[#27272A] text-black dark:text-white hover:bg-[#FAF9F5]'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Split results */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="inset-card p-3 space-y-1">
            <div className="label-caps" style={{ fontSize: '9px' }}>YOU KEEP (90%)</div>
            <div className="font-display font-black text-xl text-black dark:text-white">
              ${earnerPayout.toFixed(2)}
            </div>
            <div className="text-[10px] font-mono text-black/60 dark:text-white/60 font-bold">Auto-deposit to rail</div>
            <div className="progress-track h-2 mt-1.5">
              <div className="progress-fill-periwinkle h-full" style={{ width: '90%' }} />
            </div>
          </div>

          <div className="inset-card p-3 space-y-1">
            <div className="label-caps" style={{ fontSize: '9px' }}>BACKERS (10%)</div>
            <div className="font-display font-black text-xl text-red-600 dark:text-red-400">
              ${backerPayout.toFixed(2)}
            </div>
            <div className="text-[10px] font-mono text-black/60 dark:text-white/60 font-bold">Pro-rata syndicate</div>
            <div className="progress-track h-2 mt-1.5">
              <div className="bg-red-500 border-r-2 border-black h-full" style={{ width: '10%' }} />
            </div>
          </div>
        </div>

        {/* Backer breakdown */}
        <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-white dark:bg-[#18181B] shadow-[2px_2px_0px_#000] space-y-2">
          <div className="label-caps mb-1" style={{ fontSize: '9px' }}>SYNDICATE BREAKDOWN</div>
          {backers.map((b) => (
            <div key={b.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-md bg-[#FFC800] border border-black flex items-center justify-center text-[9px] font-display font-black text-black">
                    {b.name[0]}
                  </div>
                  <span className="text-xs font-black text-black dark:text-white">
                    {b.name} <span className="text-black/50 dark:text-white/50 font-normal">({b.share}%)</span>
                  </span>
                </div>
                <span className="font-mono text-xs font-black text-black dark:text-white">${b.amount.toFixed(2)}</span>
              </div>
              <div className="progress-track h-1.5">
                <div className="progress-fill-periwinkle h-full" style={{ width: `${b.share}%` }} />
              </div>
            </div>
          ))}
        </div>

        {broadcastDone && (
          <div className="p-3 rounded-xl flex items-center justify-between text-xs bg-[#FFFBEB] dark:bg-[#1E1E22] border-2 border-black dark:border-[#FFC800] shadow-[2px_2px_0px_#000] animate-scale-in">
            <span className="flex items-center gap-1.5 font-display font-black uppercase text-black dark:text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={3} />
              SETTLED ON MONAD!
            </span>
            <Link
              href="/dashboard"
              className="font-display font-black text-black dark:text-[#FFC800] uppercase underline hover:text-[#FFC800]"
            >
              View Wallet →
            </Link>
          </div>
        )}

        {/* Brutalist Split Button (Yellow + Black Arrow) */}
        <button
          onClick={handleBroadcast}
          disabled={broadcasting}
          className="w-full flex items-stretch rounded-xl border-2 border-black dark:border-white/30 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFC800] overflow-hidden active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 group"
        >
          <div className="flex-1 bg-[#FFC800] group-hover:bg-[#FFD21A] py-3.5 text-center font-display font-black text-xs uppercase tracking-wider text-black flex items-center justify-center gap-2 transition-colors">
            {broadcasting ? (
              <>
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>SPLITTING ON MONAD…</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" strokeWidth={2.5} />
                <span>TEST THIS PAYMENT LIVE ON MONAD</span>
              </>
            )}
          </div>
          <div className="w-12 bg-black flex items-center justify-center text-white group-hover:bg-neutral-800 transition-colors">
            <ArrowRight className="h-5 w-5" strokeWidth={3} />
          </div>
        </button>
      </div>
    </div>
  );
}
