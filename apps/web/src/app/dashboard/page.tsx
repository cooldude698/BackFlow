'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  PlusCircle,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

export default function EarnerDashboard() {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Rahul's live agreement state
  const agreement = {
    id: 'BF-001',
    earnerName: 'Rahul',
    earnerAddress: '0x1001000000000000000000000000000000001001',
    fundingTarget: 2000,
    totalFunded: 2000,
    revenueShare: '10.00%',
    capMultiplier: '2.00×',
    totalMaximumReturn: 4000,
    totalDistributed: 100, // $100 distributed from $1,000 test payment
    earnerEarned: 900,
    status: 'ACTIVE',
    duration: '12 Months'
  };

  const backers = [
    {
      name: 'Aman (Backer A)',
      address: '0x2001...2001',
      funded: 400,
      sharePercent: '20%',
      received: 20,
      maxCap: 800,
      completed: false
    },
    {
      name: 'Priya (Backer B)',
      address: '0x2002...2002',
      funded: 600,
      sharePercent: '30%',
      received: 30,
      maxCap: 1200,
      completed: false
    },
    {
      name: 'Karan (Backer C)',
      address: '0x2003...2003',
      funded: 1000,
      sharePercent: '50%',
      received: 50,
      maxCap: 2000,
      completed: false
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/BF-001`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Earner Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Agreement
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Managing Rahul&apos;s Revenue-Sharing Agreement <span className="font-mono text-brand-300">#{agreement.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-semibold transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link Copied!' : 'Copy Payment Link'}
          </button>

          <Link
            href="/pay/BF-001"
            className="glow-btn flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Open Client Pay Page
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>UPFRONT FUNDED</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">${agreement.totalFunded.toLocaleString()} <span className="text-xs font-normal text-slate-400">USDC</span></div>
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <span>✓ 100% Target Met ($2,000)</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>REVENUE SHARE RATE</span>
            <Percent className="h-4 w-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-brand-400">{agreement.revenueShare}</div>
          <div className="text-xs text-slate-400">
            Until 2.0× max cap is reached
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>BACKER DISTRIBUTIONS</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">${agreement.totalDistributed} <span className="text-xs font-normal text-slate-400">/ ${agreement.totalMaximumReturn}</span></div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{ width: `${(agreement.totalDistributed / agreement.totalMaximumReturn) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>EARNER NET REVENUE KEPT</span>
            <Sparkles className="h-4 w-4 text-brand-glow" />
          </div>
          <div className="text-2xl font-black text-emerald-400">${agreement.earnerEarned} <span className="text-xs font-normal text-slate-400">USDC</span></div>
          <div className="text-xs text-slate-400">
            From settled invoices (90% cut)
          </div>
        </div>
      </div>

      {/* Backer Syndicate Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-400" />
              Active Backer Syndicate ({backers.length} Backers)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Positions registered on-chain in <code className="text-brand-300">AgreementManager.sol</code>
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            Agreement ID: 0x01 (Monad)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Backer</th>
                <th className="pb-3">Funded Capital</th>
                <th className="pb-3">Pool Share</th>
                <th className="pb-3">Max Cap (2×)</th>
                <th className="pb-3">Received So Far</th>
                <th className="pb-3 pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {backers.map((b, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 pl-2">
                    <div className="font-semibold text-white">{b.name}</div>
                    <div className="text-xs font-mono text-slate-400">{b.address}</div>
                  </td>
                  <td className="py-4 font-mono text-slate-200">${b.funded} USDC</td>
                  <td className="py-4 font-mono text-brand-400 font-bold">{b.sharePercent}</td>
                  <td className="py-4 font-mono text-slate-200">${b.maxCap} USDC</td>
                  <td className="py-4">
                    <div className="font-mono text-emerald-400">${b.received} USDC</div>
                    <div className="text-[11px] text-slate-500">Remaining: ${b.maxCap - b.received}</div>
                  </td>
                  <td className="py-4 pr-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
