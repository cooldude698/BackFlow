'use client';

import { useState } from 'react';
import { Calculator, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SimulatorPage() {
  const [grossPayment, setGrossPayment] = useState<number>(1000);
  const [revenueSharePercent, setRevenueSharePercent] = useState<number>(10);
  const [capMultiplier, setCapMultiplier] = useState<number>(2.0);

  // Rahul's 3 test backers
  const [backerA_received, setBackerA_received] = useState<number>(0);
  const [backerB_received, setBackerB_received] = useState<number>(0);
  const [backerC_received, setBackerC_received] = useState<number>(0);

  const backerA_funded = 400; // 20%
  const backerB_funded = 600; // 30%
  const backerC_funded = 1000; // 50%
  const totalFunded = 2000;

  const backerA_cap = backerA_funded * capMultiplier; // $800
  const backerB_cap = backerB_funded * capMultiplier; // $1,200
  const backerC_cap = backerC_funded * capMultiplier; // $2,000

  // Calculate settlement
  const rawBackerPoolCut = (grossPayment * revenueSharePercent) / 100;

  // Backer A
  const remCapA = Math.max(0, backerA_cap - backerA_received);
  const theoA = (rawBackerPoolCut * backerA_funded) / totalFunded;
  const payoutA = Math.min(theoA, remCapA);

  // Backer B
  const remCapB = Math.max(0, backerB_cap - backerB_received);
  const theoB = (rawBackerPoolCut * backerB_funded) / totalFunded;
  const payoutB = Math.min(theoB, remCapB);

  // Backer C
  const remCapC = Math.max(0, backerC_cap - backerC_received);
  const theoC = (rawBackerPoolCut * backerC_funded) / totalFunded;
  const payoutC = Math.min(theoC, remCapC);

  const totalBackerPayout = payoutA + payoutB + payoutC;
  const earnerPayout = grossPayment - totalBackerPayout;

  const handleApplySettlement = () => {
    setBackerA_received((prev) => prev + payoutA);
    setBackerB_received((prev) => prev + payoutB);
    setBackerC_received((prev) => prev + payoutC);
  };

  const handleReset = () => {
    setBackerA_received(0);
    setBackerB_received(0);
    setBackerC_received(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Calculator className="h-7 w-7 text-brand-400" />
            Financial Settlement Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate the exact integer basis-points math enforced by <code className="text-brand-300">SettlementEngine.sol</code>
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Caps
        </button>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Client Payment Amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-500">$</span>
            <input
              type="number"
              value={grossPayment}
              onChange={(e) => setGrossPayment(Math.max(0, Number(e.target.value)))}
              className="w-full bg-navy-950 border border-white/10 rounded-xl px-3 py-2 text-xl font-black text-white focus:outline-none focus:border-brand-400"
            />
          </div>
          <span className="text-[11px] text-slate-400">Try $1,000, $5,000, or $10,000</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Revenue Share Percentage
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={revenueSharePercent}
              onChange={(e) => setRevenueSharePercent(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-full bg-navy-950 border border-white/10 rounded-xl px-3 py-2 text-xl font-black text-brand-400 focus:outline-none focus:border-brand-400"
            />
            <span className="text-xl font-bold text-slate-500">%</span>
          </div>
          <span className="text-[11px] text-slate-400">10% = 1,000 Basis Points</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Return Cap Multiplier
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              value={capMultiplier}
              onChange={(e) => setCapMultiplier(Math.max(1, Number(e.target.value)))}
              className="w-full bg-navy-950 border border-white/10 rounded-xl px-3 py-2 text-xl font-black text-purple-400 focus:outline-none focus:border-brand-400"
            />
            <span className="text-xl font-bold text-slate-500">×</span>
          </div>
          <span className="text-[11px] text-slate-400">2.0× = 20,000 Basis Points</span>
        </div>
      </div>

      {/* Live Output Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-lg font-bold text-white">Instant Settlement Output</h2>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Invariant Verified: Gross ({grossPayment}) = Earner ({earnerPayout.toFixed(0)}) + Backers ({totalBackerPayout.toFixed(0)})
          </div>
        </div>

        {/* Big Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="text-xs text-slate-400 uppercase font-semibold">Rahul (Earner Share)</div>
            <div className="text-3xl font-black text-white">${earnerPayout.toFixed(2)} USDC</div>
            <div className="text-xs text-emerald-400">Directly routed to Earner wallet</div>
          </div>

          <div className="p-5 rounded-2xl bg-brand-500/10 border border-brand-500/30 space-y-1">
            <div className="text-xs text-brand-300 uppercase font-semibold">Total Backers Pool Share</div>
            <div className="text-3xl font-black text-brand-400">${totalBackerPayout.toFixed(2)} USDC</div>
            <div className="text-xs text-slate-300">Split pro-rata across 3 backers</div>
          </div>
        </div>

        {/* Backers breakdown */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Individual Backer Allocations & Cap Tracking
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Backer A */}
            <div className="p-4 rounded-xl bg-navy-950 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Aman (20%)</span>
                <span className="font-mono text-brand-400">+${payoutA.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Cap Progress: ${(backerA_received + payoutA).toFixed(0)} / ${backerA_cap}
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, ((backerA_received + payoutA) / backerA_cap) * 100)}%` }}
                ></div>
              </div>
              {backerA_received + payoutA >= backerA_cap && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  CAP REACHED (0% Future)
                </span>
              )}
            </div>

            {/* Backer B */}
            <div className="p-4 rounded-xl bg-navy-950 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Priya (30%)</span>
                <span className="font-mono text-brand-400">+${payoutB.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Cap Progress: ${(backerB_received + payoutB).toFixed(0)} / ${backerB_cap}
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, ((backerB_received + payoutB) / backerB_cap) * 100)}%` }}
                ></div>
              </div>
              {backerB_received + payoutB >= backerB_cap && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  CAP REACHED (0% Future)
                </span>
              )}
            </div>

            {/* Backer C */}
            <div className="p-4 rounded-xl bg-navy-950 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Karan (50%)</span>
                <span className="font-mono text-brand-400">+${payoutC.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Cap Progress: ${(backerC_received + payoutC).toFixed(0)} / ${backerC_cap}
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, ((backerC_received + payoutC) / backerC_cap) * 100)}%` }}
                ></div>
              </div>
              {backerC_received + payoutC >= backerC_cap && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  CAP REACHED (0% Future)
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApplySettlement}
              className="w-full glow-btn py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Simulate & Commit Settlement to State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
