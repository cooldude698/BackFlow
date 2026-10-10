'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowUpRight,
  Send,
  Zap,
  Users,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  TrendingDown,
  ShieldCheck,
  ChevronRight,
  QrCode
} from 'lucide-react';
import {
  getAgreement,
  getSettlements,
  relayPayment,
  microToDollars,
  AgreementDTO,
  SettlementRecordDTO
} from '@/lib/api';

export default function EarnerDashboard() {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // Quick Charge Form
  const [chargeAmount, setChargeAmount] = useState<number>(1000);
  const [chargeDesc, setChargeDesc] = useState<string>('Client Project Milestone');

  // Live data from backend
  const [agreement, setAgreement] = useState<AgreementDTO | null>(null);
  const [settlements, setSettlements] = useState<SettlementRecordDTO[]>([]);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [ag, stl] = await Promise.all([
        getAgreement('BF-001'),
        getSettlements('BF-001')
      ]);
      setAgreement(ag);
      setSettlements(stl);
    } catch (e: any) {
      console.warn('Dashboard sync:', e.message);
    } finally {
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(false), 3500);
    return () => clearInterval(timer);
  }, [loadData]);

  // 1-Click quick test payment
  const handleQuickTestPay = async () => {
    setTriggering(true);
    try {
      await relayPayment('BF-001', '1000000000'); // $1,000 USDC
      await loadData(false);
    } catch (e: any) {
      alert(`Test payment error: ${e.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pay/BF-001?amount=${chargeAmount}&desc=${encodeURIComponent(chargeDesc)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Financial figures
  const totalFunded = agreement ? microToDollars(agreement.totalFunded) : 2000;
  const totalRepaid = agreement ? microToDollars(agreement.totalDistributed) : 0;
  const maxCap = agreement ? microToDollars(agreement.totalMaximumReturn) : 4000;
  const capProgress = Math.min(100, Math.round((totalRepaid / (maxCap || 1)) * 100));

  const totalEarnedNet = settlements.reduce((acc, curr) => {
    return acc + microToDollars(curr.earnerAmount);
  }, 0);

  return (
    <div className="space-y-4">
      {/* 1. Main Balance Hero Card (Pure Black & Periwinkle Glow) */}
      <div className="app-card-highlight p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
          <span className="font-medium tracking-wide uppercase text-[10px] text-periwinkle font-mono">
            Rahul • Freelancer Account
          </span>
          <button
            onClick={() => loadData(true)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-periwinkle' : ''}`} />
          </button>
        </div>

        <div className="space-y-1 pt-1">
          <div className="text-xs text-slate-400">Total Net Revenue Kept</div>
          <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1.5">
            ${totalEarnedNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-sm font-semibold text-periwinkle">USDC</span>
          </div>
        </div>

        {/* Repayment Progress Pill */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            Repaid to Backers:{' '}
            <span className="font-semibold text-coral font-mono">
              ${totalRepaid.toFixed(2)}
            </span>{' '}
            <span className="text-slate-500">/ ${maxCap.toLocaleString()} (2× Cap)</span>
          </div>
          <span className="text-[11px] font-bold text-coral bg-coral/10 border border-coral/20 px-2 py-0.5 rounded-full font-mono">
            {capProgress}% Cap
          </span>
        </div>

        {/* Cap meter bar */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-periwinkle to-coral transition-all duration-500 rounded-full"
            style={{ width: `${capProgress}%` }}
          />
        </div>
      </div>

      {/* 2. Primary Mobile Action Buttons (Two Clean Touch Targets) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setModalOpen(true)}
          className="btn-periwinkle py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-periwinkle/15"
        >
          <QrCode className="h-4 w-4" />
          Charge Client
        </button>

        <button
          onClick={handleQuickTestPay}
          disabled={triggering}
          className="app-card py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-white hover:border-periwinkle/40 transition-colors disabled:opacity-50"
        >
          {triggering ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Splitting...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-coral" />
              <span>⚡ Test $1k Pay</span>
            </>
          )}
        </button>
      </div>

      {/* 3. How It Works - Clean 1-Sentence Visual Ribbon */}
      <div className="app-card p-3.5 flex items-center gap-3 text-xs bg-[#0a0a0f]">
        <div className="h-7 w-7 rounded-xl bg-periwinkle/15 flex items-center justify-center text-periwinkle flex-shrink-0 font-bold">
          90/10
        </div>
        <div className="text-[11px] text-slate-300 leading-snug">
          You keep <strong className="text-white">90%</strong> of client payments. <strong className="text-coral">10%</strong> automatically repays your backers until the 2× cap is hit.
        </div>
      </div>

      {/* 4. Backers Circle (Clean Simple List) */}
      <div className="app-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
            <Users className="h-3.5 w-3.5 text-periwinkle" />
            Your Backers ({agreement?.backers?.length || 3})
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            ${totalFunded.toLocaleString()} Upfront Raised
          </span>
        </div>

        <div className="space-y-2">
          {agreement?.backers?.map((b) => {
            const funded = microToDollars(b.fundedAmount);
            const received = microToDollars(b.distributedAmount);
            const cap = microToDollars(b.maxCap);
            const percent = ((funded / totalFunded) * 100).toFixed(0);

            return (
              <div
                key={b.id}
                className="p-2.5 rounded-xl bg-black/50 border border-white/[0.05] flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {b.backerName.split(' ')[0]}
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({percent}% pool share)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Funded ${funded.toFixed(0)} • Cap ${cap.toFixed(0)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-coral">
                    ${received.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Repaid So Far
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Activity Ledger */}
      <div className="app-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white uppercase tracking-wide">
            Recent Inflows ({settlements.length})
          </div>
          <span className="text-[10px] font-mono text-periwinkle bg-periwinkle/10 px-2 py-0.5 rounded-full">
            Auto-Split
          </span>
        </div>

        {settlements.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 space-y-2">
            <div>No payments received yet.</div>
            <button
              onClick={handleQuickTestPay}
              className="text-periwinkle font-semibold hover:underline text-[11px]"
            >
              Tap &quot;⚡ Test $1k Pay&quot; to test instant split
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.slice(0, 5).map((s) => {
              const gross = microToDollars(s.grossAmount);
              const earner = microToDollars(s.earnerAmount);
              const backer = microToDollars(s.totalBackerAmount);
              const time = new Date(s.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-black/60 border border-white/[0.04] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      Client Paid ${gross.toFixed(0)} USDC
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {time} • Tx {s.transactionHash.slice(0, 8)}...
                    </div>
                  </div>

                  <div className="text-right space-y-0.5 font-mono">
                    <div className="font-bold text-periwinkle text-[11px]">
                      +${earner.toFixed(2)} to You
                    </div>
                    <div className="text-[10px] text-coral">
                      -${backer.toFixed(2)} to Backers
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charge Client Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full sm:max-w-sm bg-[#0e0e14] border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-white">Charge Client</h3>
                <p className="text-[11px] text-slate-400">Generate your 90/10 auto-split payment link</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  Invoice Amount (USDC)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-8 pr-16 py-2.5 rounded-xl bg-black border border-white/10 text-white font-bold text-lg focus:outline-none focus:border-periwinkle"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-mono">
                    USDC
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  For (Description)
                </label>
                <input
                  type="text"
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-white text-xs focus:outline-none focus:border-periwinkle"
                />
              </div>

              {/* Instant Split Preview */}
              <div className="p-3 rounded-xl bg-black/80 border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>You Keep (90%):</span>
                  <span className="font-mono font-bold text-periwinkle">
                    ${(chargeAmount * 0.9).toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Backers Deducted (10%):</span>
                  <span className="font-mono font-bold text-coral">
                    ${(chargeAmount * 0.1).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="w-full btn-periwinkle py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Link Copied!' : 'Copy Payment Link'}
              </button>

              <Link
                href={`/pay/BF-001?amount=${chargeAmount}&desc=${encodeURIComponent(chargeDesc)}`}
                className="w-full py-2.5 rounded-xl bg-white/5 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/10 border border-white/10"
              >
                Open Payment Screen Directly <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
