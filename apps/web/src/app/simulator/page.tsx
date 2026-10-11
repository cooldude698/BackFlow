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
    } catch (e: any) {
      alert(`Simulation broadcast failed: ${e.message}`);
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
    <div className="space-y-3.5 animate-fade-in-up">
      {/* Top bar */}
      <div className="flex items-center justify-between text-xs">
        <Link href="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <ChevronLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
        <span className="badge-periwinkle">Math Simulator</span>
      </div>

      {/* Simulator Card */}
      <div className="app-card-highlight p-5 space-y-5 relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)' }}
        />

        <div>
          <div className="label-caps mb-1 text-indigo-600 font-bold">Interactive Calculator</div>
          <h2 className="text-[20px] font-extrabold text-slate-900 leading-tight">How Any Payment Splits</h2>
          <p className="text-[11px] text-slate-500 mt-1">Slide or choose an amount — see the exact 90/10 split instantly.</p>
        </div>

        {/* Amount control */}
        <div className="bg-white rounded-2xl p-4 space-y-4 border border-slate-200/90 shadow-2xs">
          <div className="flex justify-between items-baseline">
            <span className="label-caps">Client Payment</span>
            <span className="amount-display text-[1.8rem] text-slate-900">
              ${grossPayment.toLocaleString()}
              <span className="text-xs font-bold ml-1.5 mono text-indigo-600">USDC</span>
            </span>
          </div>

          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={grossPayment}
            onChange={(e) => setGrossPayment(Number(e.target.value))}
            className="w-full"
          />

          <div className="flex justify-between gap-1.5">
            {[500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setGrossPayment(preset)}
                className={`flex-1 py-1.5 text-[11px] mono rounded-xl transition-all font-semibold ${
                  grossPayment === preset
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Split results */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="inset-card p-3.5 space-y-1.5">
            <div className="label-caps">Rahul Kept</div>
            <div className="amount-display text-[1.5rem] text-indigo-600">
              ${earnerPayout.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">90% → earner wallet</div>
            <div className="progress-track h-1 mt-2">
              <div className="progress-fill-periwinkle h-full" style={{ width: '90%' }} />
            </div>
          </div>

          <div className="inset-card p-3.5 space-y-1.5">
            <div className="label-caps">Backers Pool</div>
            <div className="amount-display text-[1.5rem] text-coral">
              ${backerPayout.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">10% → syndicate</div>
            <div className="progress-track h-1 mt-2">
              <div className="progress-fill-coral h-full" style={{ width: '10%' }} />
            </div>
          </div>
        </div>

        {/* Backer breakdown */}
        <div className="bg-white rounded-2xl p-3.5 space-y-2.5 border border-slate-200/80 shadow-2xs">
          <div className="label-caps mb-1">Syndicate Breakdown</div>
          {backers.map((b) => (
            <div key={b.name}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black bg-indigo-100 text-indigo-700">
                    {b.name[0]}
                  </div>
                  <span className="text-[11px] text-slate-700 font-medium">{b.name} <span className="text-slate-400">({b.share}%)</span></span>
                </div>
                <span className="mono text-[11px] font-bold text-slate-900">${b.amount.toFixed(2)}</span>
              </div>
              <div className="progress-track h-0.5">
                <div className="progress-fill-periwinkle h-full" style={{ width: `${b.share}%` }} />
              </div>
            </div>
          ))}
        </div>

        {broadcastDone && (
          <div className="p-3.5 rounded-xl flex items-center justify-between text-[12px] animate-scale-in bg-indigo-50 border border-indigo-200 shadow-2xs">
            <span className="flex items-center gap-1.5 font-bold text-indigo-700">
              <CheckCircle2 className="h-4 w-4" />
              Settled on Monad!
            </span>
            <Link href="/dashboard" className="font-bold text-indigo-600 hover:underline text-[11px]">
              View Wallet →
            </Link>
          </div>
        )}

        <button
          onClick={handleBroadcast}
          disabled={broadcasting}
          className="w-full btn-periwinkle py-4 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {broadcasting ? (
            <>
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Splitting on Monad…</span>
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
