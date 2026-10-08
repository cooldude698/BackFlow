'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export default function PaymentPage() {
  const [paying, setPaying] = useState(false);
  const [settled, setSettled] = useState(false);
  const [txHash, setTxHash] = useState('');

  const invoice = {
    id: 'INV-2026-089',
    agreementId: 'BF-001',
    earner: 'Rahul',
    earnerRole: 'Full-Stack Developer',
    description: 'Frontend & Smart Contract Integration Milestone',
    amount: 1000,
    currency: 'USDC',
    revenueShareBps: 1000 // 10%
  };

  const handlePay = async () => {
    setPaying(true);
    // Simulate Monad testnet block confirmation with passkey authentication
    setTimeout(() => {
      const mockHash = '0x9e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a';
      setTxHash(mockHash);
      setPaying(false);
      setSettled(true);
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      {/* Back link */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
          ← Back to Earner Dashboard
        </Link>
        <span className="flex items-center gap-1.5 font-mono text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Monad Testnet Verified
        </span>
      </div>

      {/* Main Payment Card */}
      <div className="glass-panel-glow rounded-3xl p-8 sm:p-10 border border-teal-500/30 space-y-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-400">
              Verified Invoice #{invoice.id}
            </span>
            <h1 className="text-2xl font-black text-white">Payment to {invoice.earner}</h1>
            <p className="text-xs text-slate-400">{invoice.description}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-mono text-2xl">
            🌊
          </div>
        </div>

        {/* Amount Display */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-baseline justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Amount Due</div>
            <div className="text-4xl font-black text-white mt-1">
              ${invoice.amount.toLocaleString()} <span className="text-lg text-slate-400 font-normal">USDC</span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            Agreement #{invoice.agreementId}
          </span>
        </div>

        {/* Settlement Preview Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              Automated Smart Contract Settlement Preview
            </span>
            <span className="text-emerald-400 font-mono">100% Deterministic</span>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/80 border border-white/5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Rahul (Earner - 90%)</span>
              <span className="font-mono font-bold text-white">$900.00 USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Backers Syndicate (10% Revenue Share)</span>
              <span className="font-mono font-bold text-brand-400">$100.00 USDC</span>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-slate-400 pl-3">
              <div className="flex justify-between">
                <span>• Aman (20% pro-rata share):</span>
                <span className="font-mono text-slate-300">$20.00 USDC</span>
              </div>
              <div className="flex justify-between">
                <span>• Priya (30% pro-rata share):</span>
                <span className="font-mono text-slate-300">$30.00 USDC</span>
              </div>
              <div className="flex justify-between">
                <span>• Karan (50% pro-rata share):</span>
                <span className="font-mono text-slate-300">$50.00 USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!settled ? (
          <div className="space-y-3">
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full glow-btn py-4 rounded-2xl flex items-center justify-center gap-2 text-base font-extrabold disabled:opacity-50"
            >
              {paying ? (
                <>
                  <span className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Settling on Monad Testnet via Passkey...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay $1,000 USDC (1-Click Passkey)
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
              Direct execution via <code className="text-brand-300">SettlementEngine.sol</code> • Zero backend custody
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400 font-bold text-lg">
              <CheckCircle2 className="h-6 w-6" />
              Settlement Completed Successfully!
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              $1,000 USDC was atomically settled on Monad. Rahul received $900 and backers received $100 instantaneously.
            </p>
            <div className="p-3 rounded-lg bg-black/40 font-mono text-[11px] text-slate-400 break-all border border-white/5">
              Tx Hash: <span className="text-emerald-400">{txHash}</span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-300 hover:text-white"
            >
              View Updated Balances on Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
