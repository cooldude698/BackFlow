'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Zap,
  Users,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  TrendingUp,
  ArrowDownLeft,
  Sparkles,
  CreditCard,
  Building,
  LogOut
} from 'lucide-react';
import {
  getAgreement,
  getSettlements,
  relayPayment,
  microToDollars,
  getUserProfile,
  AgreementDTO,
  SettlementRecordDTO,
  UserProfileDTO
} from '@/lib/api';

export default function EarnerDashboard() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number>(1000);
  const [chargeDesc, setChargeDesc] = useState<string>('Client Project Milestone');

  const [agreement, setAgreement] = useState<AgreementDTO | null>(null);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [settlements, setSettlements] = useState<SettlementRecordDTO[]>([]);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [ag, stl, prf] = await Promise.all([
        getAgreement('BF-001'),
        getSettlements('BF-001'),
        getUserProfile().catch(() => null)
      ]);
      setAgreement(ag);
      setSettlements(stl);
      if (prf) setProfile(prf);
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('backflow_user');
    }
    router.push('/login');
  };

  const handleQuickTestPay = async () => {
    setTriggering(true);
    try {
      await relayPayment(
        'BF-001',
        '1000000000',
        '0xClientPayer999900000000000000000000000001',
        'Global Card (Visa •••• 8821)',
        'Acme Corp'
      );
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

  const totalFunded = agreement ? microToDollars(agreement.totalFunded) : 2000;
  const totalRepaid = agreement ? microToDollars(agreement.totalDistributed) : 0;
  const maxCap = agreement ? microToDollars(agreement.totalMaximumReturn) : 4000;
  const capProgress = Math.min(100, Math.round((totalRepaid / (maxCap || 1)) * 100));

  const totalEarnedNet = settlements.reduce((acc, curr) => {
    return acc + microToDollars(curr.earnerAmount);
  }, 0);

  const earnerName = profile?.name || agreement?.earnerName || 'Aman';
  const payoutRailId = profile?.payoutIdentifier || 'aman@upi';

  return (
    <div className="space-y-3.5 animate-fade-in-up">

      {/* Hero Balance Card */}
      <div className="app-card-highlight p-5 relative overflow-hidden">
        <div
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)' }}
        />

        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <span className="label-caps tracking-widest text-indigo-600 font-bold">
              {earnerName} · Verified Earner
            </span>
            <span className="text-[10px] text-slate-500 mono font-medium">BF-001 · Monad Testnet</span>
          </div>
          <button
            onClick={() => loadData(true)}
            className="h-7 w-7 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all active:scale-90 shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

        <div className="space-y-0.5 mb-4">
          <div className="text-[11px] text-slate-500 font-medium">Total Net Revenue Kept</div>
          <div className="flex items-baseline gap-2">
            <span className="amount-display text-[2.6rem] text-slate-900 tracking-tight">
              ${totalEarnedNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-bold mono text-indigo-600">USDC</span>
          </div>
        </div>

        <div className="divider mb-3" />
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">
              Repaid to Backers:{' '}
              <span className="font-bold mono text-coral">${totalRepaid.toFixed(2)}</span>
              <span className="text-slate-400"> / ${maxCap.toLocaleString()} cap</span>
            </span>
            <span className="badge-coral">{capProgress}% Cap</span>
          </div>
          <div className="progress-track h-1.5">
            <div className="progress-fill-periwinkle h-full" style={{ width: `${capProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Connected Payout Rail Status Card (UPI / Card) */}
      <div className="app-card p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            {profile?.payoutType === 'card' ? (
              <CreditCard className="h-4 w-4" />
            ) : profile?.payoutType === 'bank' ? (
              <Building className="h-4 w-4" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Automatic Payout Rail (90% Auto-Deposit)
            </div>
            <div className="font-mono font-bold text-slate-900 text-xs">
              {payoutRailId}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/profile"
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 transition-colors"
          >
            Change
          </Link>
          <button
            onClick={handleLogout}
            className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center gap-1 transition-colors"
            title="Log out"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setModalOpen(true)}
          className="btn-periwinkle py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-[13px]"
        >
          <QrCode className="h-4 w-4 flex-shrink-0" />
          <span className="font-black">Charge Client</span>
        </button>

        <button
          onClick={handleQuickTestPay}
          disabled={triggering}
          className="btn-ghost py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 text-[13px] disabled:opacity-50"
        >
          {triggering ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="font-bold text-slate-900">Splitting…</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-coral flex-shrink-0" />
              <span className="font-bold">Test $1k Pay</span>
            </>
          )}
        </button>
      </div>

      {/* Info Banner */}
      <div className="inset-card px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 border border-indigo-200/60 shadow-2xs">
          <span className="text-[10px] font-black mono text-indigo-600">90/10</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-snug">
          You keep <strong className="text-slate-900 font-bold">90%</strong> of every payment.{' '}
          <strong className="text-coral font-bold">10%</strong> auto-repays backers until the 2× cap is hit.
        </p>
      </div>

      {/* Backers Card */}
      <div className="app-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-indigo-50 border border-indigo-100">
              <Users className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <span className="text-[12px] font-black text-slate-900 tracking-tight">
              Your Backers ({agreement?.backers?.length || 3})
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="mono text-[11px] font-bold text-slate-900">${totalFunded.toLocaleString()}</span>
            <span className="label-caps">upfront raised</span>
          </div>
        </div>

        <div className="space-y-2">
          {(agreement?.backers ?? []).map((b) => {
            const funded = microToDollars(b.fundedAmount);
            const received = microToDollars(b.distributedAmount);
            const cap = microToDollars(b.maxCap);
            const percent = ((funded / totalFunded) * 100).toFixed(0);
            const repaidPct = Math.min(100, Math.round((received / cap) * 100));
            return (
              <div key={b.id} className="inset-card px-3 py-2.5 animate-fade-in-up">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black bg-indigo-100 text-indigo-700">
                      {b.backerName[0]}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-900 leading-tight">{b.backerName.split(' ')[0]}</div>
                      <div className="text-[10px] mono text-slate-500">{percent}% pool · Cap ${cap.toFixed(0)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-[12px] font-bold text-coral">${received.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400">repaid</div>
                  </div>
                </div>
                <div className="progress-track h-1">
                  <div className="progress-fill-coral h-full" style={{ width: `${repaidPct}%` }} />
                </div>
              </div>
            );
          })}

          {(!agreement?.backers || agreement.backers.length === 0) && (
            <>
              {[
                { name: 'Aman', share: 20, cap: 800 },
                { name: 'Priya', share: 30, cap: 1200 },
                { name: 'Karan', share: 50, cap: 2000 },
              ].map((b) => (
                <div key={b.name} className="inset-card px-3 py-2.5 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black bg-indigo-100 text-indigo-700">
                        {b.name[0]}
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-slate-900 leading-tight">{b.name}</div>
                        <div className="text-[10px] mono text-slate-500">{b.share}% pool · Cap ${b.cap}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mono text-[12px] font-bold text-coral">$0.00</div>
                      <div className="text-[10px] text-slate-400">repaid</div>
                    </div>
                  </div>
                  <div className="progress-track h-1">
                    <div className="progress-fill-coral h-full" style={{ width: '0%' }} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Recent Inflows */}
      <div className="app-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-100">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-[12px] font-black text-slate-900">
              Recent Inflows ({settlements.length})
            </span>
          </div>
          <span className="badge-periwinkle">Auto-Split</span>
        </div>

        {settlements.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto bg-slate-50 border border-slate-200 shadow-2xs">
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-1">
              <div className="text-[12px] text-slate-700 font-semibold">No payments yet</div>
              <div className="text-[11px] text-slate-500">Hit "Test $1k Pay" to see the instant split in action.</div>
            </div>
            <button onClick={handleQuickTestPay} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              ⚡ Trigger Test Payment →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.slice(0, 5).map((s) => {
              const gross = microToDollars(s.grossAmount);
              const earner = microToDollars(s.earnerAmount);
              const backer = microToDollars(s.totalBackerAmount);
              const time = new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={s.id} className="inset-card px-3 py-3 flex items-center justify-between animate-fade-in-up">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 border border-emerald-100">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-slate-900">
                        Client paid <span className="mono font-bold">${gross.toFixed(0)}</span> USDC
                      </div>
                      <div className="text-[10px] mono text-slate-400">
                        {time} · {(s as any).paymentMethod || s.transactionHash?.slice(0, 10) + '…'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="mono text-[12px] font-bold text-indigo-600">+${earner.toFixed(2)}</div>
                    <div className="mono text-[10px] text-coral">−${backer.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charge Client Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in"
          style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full sm:max-w-sm bg-white border border-slate-200/80 shadow-2xl rounded-t-[2.5rem] sm:rounded-3xl p-6 space-y-5 animate-fade-in-up">
            <div className="w-10 h-1 rounded-full mx-auto bg-slate-300" />

            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-black text-slate-900 tracking-tight">Charge Client</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Generate your 90/10 auto-split payment link</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors text-xs bg-slate-100 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="label-caps mb-1.5 block">Invoice Amount (USDC)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-8 pr-16 py-3 rounded-xl text-slate-900 font-black text-lg mono focus:outline-none transition-colors bg-slate-50 border border-slate-200 focus:border-indigo-400"
                />
                <span className="absolute right-3.5 top-3.5 text-[11px] text-slate-400 mono font-semibold">USDC</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 2000, 5000].map((p) => (
                  <button
                    key={p}
                    onClick={() => setChargeAmount(p)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] mono font-semibold transition-all ${
                      chargeAmount === p
                        ? 'font-bold bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ${p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-caps mb-1.5 block">Description</label>
              <input
                type="text"
                value={chargeDesc}
                onChange={(e) => setChargeDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-slate-900 text-[12px] focus:outline-none transition-colors bg-slate-50 border border-slate-200 focus:border-indigo-400"
              />
            </div>

            <div className="inset-card px-4 py-3 space-y-2">
              <div className="label-caps mb-1">Automatic split preview</div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-600 font-medium">Direct to {payoutRailId} (90%)</span>
                <span className="mono font-bold text-indigo-600">${(chargeAmount * 0.9).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-slate-600 font-medium">Backers (10%)</span>
                <span className="mono font-bold text-coral">${(chargeAmount * 0.1).toFixed(2)} USDC</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-1">
                <div style={{ width: '90%', background: '#6366f1' }} />
                <div style={{ width: '10%', background: '#f43f5e' }} />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="w-full btn-periwinkle py-3.5 rounded-xl text-[13px] font-black flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Link Copied! ✓' : 'Copy Payment Link'}
              </button>

              <Link
                href={`/pay/BF-001?amount=${chargeAmount}&desc=${encodeURIComponent(chargeDesc)}`}
                className="w-full py-2.5 rounded-xl btn-ghost text-[12px] flex items-center justify-center gap-1.5"
              >
                Open Pay Screen <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
