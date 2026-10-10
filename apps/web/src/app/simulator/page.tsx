'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Zap,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { relayPayment, dollarsToMicro } from '@/lib/api';

export default function MobileSimulatorPage() {
  const [grossPayment, setGrossPayment] = useState<number>(1000);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  // Rahul 90/10 terms
  const earnerPayout = grossPayment * 0.9;
  const backerPayout = grossPayment * 0.1;

  // 3 backers pro-rata
  const amanShare = backerPayout * 0.2;
  const priyaShare = backerPayout * 0.3;
  const karanShare = backerPayout * 0.5;

  const handleBroadcast = async () => {
    setBroadcasting(true);
    setBroadcastDone(false);
    try {
      await relayPayment('BF-001', dollarsToMicro(grossPayment));
      setBroadcastDone(true);
    } catch (e: any) {
      alert(`Simulation broadcast failed: ${e.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
        <span className="text-[10px] font-mono text-periwinkle bg-periwinkle/10 px-2 py-0.5 rounded-full border border-periwinkle/20">
          Math Simulator
        </span>
      </div>

      {/* Simulator Card */}
      <div className="app-card-highlight p-5 space-y-5">
        <div>
          <div className="text-[11px] font-mono text-periwinkle uppercase font-semibold">
            Interactive Calculator
          </div>
          <h2 className="text-xl font-extrabold text-white">How Any Payment Splits</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Slide or pick an amount to see the exact 90/10 split in real time.
          </p>
        </div>

        {/* Amount Slider & Presets */}
        <div className="p-4 rounded-2xl bg-black/70 border border-white/10 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Client Payment</span>
            <span className="text-2xl font-black text-white font-mono">
              ${grossPayment.toLocaleString()} <span className="text-xs text-periwinkle">USDC</span>
            </span>
          </div>

          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={grossPayment}
            onChange={(e) => setGrossPayment(Number(e.target.value))}
            className="w-full accent-periwinkle cursor-pointer"
          />

          <div className="flex justify-between gap-1.5 pt-1">
            {[500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setGrossPayment(preset)}
                className={`flex-1 py-1 text-[11px] font-mono rounded-lg transition-colors ${
                  grossPayment === preset
                    ? 'bg-periwinkle text-black font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Split Results */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Rahul Kept (90%)</div>
            <div className="text-xl font-black text-periwinkle font-mono">
              ${earnerPayout.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">Direct to Rahul&apos;s wallet</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Backers (10%)</div>
            <div className="text-xl font-black text-coral font-mono">
              ${backerPayout.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">Split across syndicate</div>
          </div>
        </div>

        {/* Backer Breakdown */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/5 space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-slate-300">Syndicate Repayment:</div>
          <div className="space-y-1.5 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>• Aman (20% pool share):</span>
              <span className="font-mono text-white font-semibold">${amanShare.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>• Priya (30% pool share):</span>
              <span className="font-mono text-white font-semibold">${priyaShare.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>• Karan (50% pool share):</span>
              <span className="font-mono text-white font-semibold">${karanShare.toFixed(2)} USDC</span>
            </div>
          </div>
        </div>

        {broadcastDone && (
          <div className="p-3 rounded-xl bg-periwinkle/15 border border-periwinkle/30 flex items-center justify-between text-xs text-periwinkle">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              Settled on Monad!
            </span>
            <Link href="/dashboard" className="underline font-bold text-white hover:text-periwinkle">
              View on Wallet
            </Link>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleBroadcast}
          disabled={broadcasting}
          className="w-full btn-periwinkle py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-periwinkle/20 disabled:opacity-50"
        >
          {broadcasting ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Splitting on Monad...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Test This Payment Live on Monad
            </>
          )}
        </button>
      </div>
    </div>
  );
}
