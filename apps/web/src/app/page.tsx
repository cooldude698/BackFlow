import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Database, Cpu, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide uppercase">
          <Zap className="h-3.5 w-3.5 text-brand-glow" />
          Monad Hackathon Consumer Payments Track
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Raise Upfront Capital.<br />
          <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Automate Revenue Sharing On-Chain.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          BackFlow lets freelancers, creators, and founders raise upfront funding from backers and automatically stream a defined percentage of future payments until an agreed return cap is met.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="glow-btn px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg"
          >
            Launch Earner Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pay/BF-001"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-semibold transition-all"
          >
            Test Consumer Payment ($1,000)
          </Link>
          <Link
            href="/simulator"
            className="px-6 py-3 rounded-xl bg-brand-900/30 hover:bg-brand-900/50 text-brand-300 border border-brand-500/30 text-sm font-semibold transition-all"
          >
            Interactive Settlement Simulator
          </Link>
        </div>
      </section>

      {/* The Single Source of Truth Card */}
      <section className="glass-panel-glow rounded-3xl p-8 sm:p-10 border border-teal-500/30 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-mono text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="h-4 w-4" />
              Core Invariant
            </div>
            <h2 className="text-2xl font-bold text-white">Smart Contract as the Single Source of Truth</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
            Zero Backend Custody
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
            <div className="text-rose-400 font-bold flex items-center gap-2 text-sm">
              <span>❌</span> The Wrong Way
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Payment hits bank account or backend → Backend database script runs → Backend calculates entitlement → Admin manually sends payouts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-brand-500/10 border border-brand-500/30 space-y-3 md:col-span-2">
            <div className="text-brand-glow font-bold flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4" /> The BackFlow Protocol
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Client Payment enters <code className="text-brand-300 font-mono">SettlementEngine.sol</code> → Contract queries active terms and remaining caps → Contract calculates pro-rata BPS distributions → Tokens atomically split to Backers and Earner.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-white">Monad Testnet Ready</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sub-second finality and EVM compatibility allow instantaneous settlement without user-facing gas friction.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-white">Cap Clamping & Cascading</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When a backer reaches their agreed cap (e.g. 2×), their share drops to 0% and excess revenue cascades directly to the Earner.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-white">Zero Trapped Funds</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mathematically proven invariant: Gross payment strictly equals total backer payouts plus earner net payout at all times.
          </p>
        </div>
      </section>
    </div>
  );
}
