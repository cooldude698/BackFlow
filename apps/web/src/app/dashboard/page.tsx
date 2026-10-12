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
  LogOut,
  ArrowRight
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
import { triggerConfetti } from '@/lib/confetti';

export default function EarnerDashboard() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
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
      triggerConfetti();
      setSuccessToast('+$900.00 Net Deposited! $100 backer repaid ✓');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (e: any) {
      alert(`Test payment error: ${e.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleCopyLink = () => {
    try {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/BF-001?amount=${chargeAmount}&desc=${encodeURIComponent(chargeDesc)}`;
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalFunded = agreement ? microToDollars(agreement.totalFunded) : 2000;
  const totalRepaid = agreement ? microToDollars(agreement.totalDistributed) : 1200;
  const maxCap = agreement ? microToDollars(agreement.totalMaximumReturn) : 4000;
  const capProgress = Math.min(100, Math.round((totalRepaid / (maxCap || 1)) * 100));

  const totalEarnedNet = settlements.reduce((acc, curr) => {
    return acc + microToDollars(curr.earnerAmount);
  }, 0) || 36000;

  const earnerName = profile?.name || agreement?.earnerName || 'Aman';
  const payoutRailId = profile?.payoutIdentifier || 'aman@upi';

  return (
    <div className="space-y-3.5">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-2.5 rounded-xl bg-[#FFC800] border-2 border-black text-black font-display font-black text-xs uppercase flex items-center justify-between shadow-[2px_2px_0px_#000] animate-bounce">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="font-bold text-xs">✕</button>
        </div>
      )}

      {/* ========================================================
          HERO BALANCE CARD (Neo-Brutalist Display)
         ======================================================== */}
      <div className="app-card-highlight p-5 relative overflow-hidden">
        {/* Decorative corner dot grid & yellow square */}
        <div className="absolute top-3 right-12 w-8 h-8 dot-grid opacity-60 pointer-events-none" />
        <div className="w-3 h-3 bg-[#FFC800] border-1.5 border-black absolute right-3 bottom-3" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="badge-periwinkle text-[9.5px]">
                {earnerName.toUpperCase()} · VERIFIED EARNER
              </span>
            </div>
            <span className="text-[10px] text-black/70 dark:text-white/70 font-mono font-bold">
              BF-001 · MONAD TESTNET
            </span>
          </div>

          <button
            onClick={() => loadData(true)}
            className="h-8 w-8 rounded-lg flex items-center justify-center bg-white dark:bg-[#27272A] border-2 border-black dark:border-white/40 shadow-[2px_2px_0px_#000] hover:bg-[#FFC800] dark:hover:bg-[#FFC800] text-black dark:text-white dark:hover:text-black transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Refresh balance"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-0.5 mb-4">
          <div className="label-caps" style={{ fontSize: '10px' }}>TOTAL NET REVENUE KEPT</div>
          <div className="flex items-baseline gap-2">
            <span className="amount-display text-[2.75rem] text-black dark:text-white tracking-tight leading-none">
              ${totalEarnedNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono font-black text-black bg-[#FFC800] px-1.5 py-0.5 border border-black rounded">
              USDC
            </span>
          </div>
        </div>

        <div className="divider my-3" />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-black dark:text-white">
              Repaid to Backers:{' '}
              <span className="font-mono text-red-600 dark:text-red-400 font-black">${totalRepaid.toFixed(2)}</span>
              <span className="text-black/60 dark:text-white/60 font-mono"> / ${maxCap.toLocaleString()} cap</span>
            </span>
            <span className="badge-periwinkle" style={{ fontSize: '9px', padding: '1px 6px' }}>
              {capProgress}% CAP
            </span>
          </div>

          <div className="progress-track h-3">
            <div className="progress-fill-periwinkle h-full" style={{ width: `${capProgress}%` }} />
          </div>
        </div>
      </div>

      {/* ========================================================
          AUTOMATIC PAYOUT RAIL STATUS CARD
         ======================================================== */}
      <div className="app-card p-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#FFC800] border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center text-black flex-shrink-0">
            {profile?.payoutType === 'card' ? (
              <CreditCard className="h-4 w-4" strokeWidth={2.5} />
            ) : profile?.payoutType === 'bank' ? (
              <Building className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <QrCode className="h-4 w-4" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <div className="label-caps" style={{ fontSize: '9px' }}>
              AUTOMATIC PAYOUT RAIL (90% AUTO-DEPOSIT)
            </div>
            <div className="font-mono font-black text-black dark:text-white text-xs">
              {payoutRailId}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/profile"
            className="text-[10.5px] font-display font-black uppercase px-2.5 py-1 rounded-md bg-white dark:bg-[#27272A] hover:bg-[#FFC800] dark:hover:bg-[#FFC800] text-black dark:text-white dark:hover:text-black border-1.5 border-black dark:border-white/30 shadow-[1.5px_1.5px_0px_#000] transition-colors"
          >
            Change
          </Link>
          <button
            onClick={handleLogout}
            className="text-[10.5px] font-display font-black uppercase px-2 py-1 rounded-md bg-white dark:bg-[#27272A] hover:bg-red-50 text-red-600 border-1.5 border-black dark:border-white/30 shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1 transition-colors"
            title="Log out"
          >
            <LogOut className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ========================================================
          ACTION BUTTONS (Split Neo-Brutalist Layout)
         ======================================================== */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-periwinkle py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
        >
          <QrCode className="h-4 w-4 flex-shrink-0 pointer-events-none" strokeWidth={2.5} />
          <span className="pointer-events-none">CHARGE CLIENT</span>
        </button>

        <button
          type="button"
          onClick={handleQuickTestPay}
          disabled={triggering}
          className="btn-ghost py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
        >
          {triggering ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>SPLITTING…</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-[#FFC800] fill-[#FFC800] stroke-black flex-shrink-0 pointer-events-none" strokeWidth={2} />
              <span className="pointer-events-none">TEST $1K PAY</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================
          INFO CALLOUT: 90/10 RULE
         ======================================================== */}
      <div className="inset-card p-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-[#FFC800] border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center flex-shrink-0">
          <span className="font-mono font-black text-[11px] text-black">90/10</span>
        </div>
        <p className="text-[11px] text-black/80 dark:text-white/80 font-medium leading-snug">
          You keep <strong className="text-black dark:text-white font-black">90%</strong> of every payment.{' '}
          <strong className="text-red-600 dark:text-red-400 font-black">10%</strong> auto-repays backers until the 2× cap is hit.
        </p>
      </div>

      {/* ========================================================
          YOUR BACKERS SECTION
         ======================================================== */}
      <div className="app-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#FFC800] border-1.5 border-black flex items-center justify-center text-black">
              <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-xs uppercase tracking-tight text-black dark:text-white">
              YOUR BACKERS ({agreement?.backers?.length || 3})
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs font-black text-black dark:text-white">${totalFunded.toLocaleString()}</span>
            <div className="label-caps" style={{ fontSize: '8.5px' }}>UPFRONT RAISED</div>
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
              <div key={b.id} className="inset-card px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-[#FFC800] border-1.5 border-black flex items-center justify-center text-[10px] font-display font-black text-black">
                      {b.backerName[0]}
                    </div>
                    <div>
                      <div className="text-[12px] font-black text-black dark:text-white leading-tight">{b.backerName.split(' ')[0]}</div>
                      <div className="text-[10px] font-mono text-black/60 dark:text-white/60 font-bold">{percent}% pool · Cap ${cap.toFixed(0)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px] font-black text-red-600 dark:text-red-400">${received.toFixed(2)}</div>
                    <div className="text-[9px] font-bold uppercase text-black/50 dark:text-white/50">repaid</div>
                  </div>
                </div>
                <div className="progress-track h-2">
                  <div className="bg-red-500 border-r-2 border-black h-full" style={{ width: `${repaidPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          RECENT INFLOWS (Auto-Split Settlements)
         ======================================================== */}
      <div className="app-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-emerald-400 border-1.5 border-black flex items-center justify-center text-black">
              <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
            <span className="font-display font-black text-xs uppercase tracking-tight text-black dark:text-white">
              RECENT INFLOWS ({settlements.length})
            </span>
          </div>
          <span className="badge-periwinkle text-[9px]">AUTO-SPLIT</span>
        </div>

        {settlements.length === 0 ? (
          <div className="py-6 text-center space-y-2 border-2 border-dashed border-black dark:border-white/30 rounded-xl p-4 bg-[#FAF9F5] dark:bg-[#18181B]">
            <Sparkles className="h-6 w-6 text-black dark:text-white mx-auto" />
            <div className="text-xs font-bold text-black dark:text-white">No payments settled yet</div>
            <div className="text-[11px] text-black/70 dark:text-white/70">Tap "Test $1k Pay" to test the automatic split on Monad.</div>
            <button
              type="button"
              onClick={handleQuickTestPay}
              disabled={triggering}
              className="font-display font-black text-xs uppercase bg-[#FFC800] hover:bg-[#FFD21A] text-black px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] inline-flex items-center gap-1 transition-all cursor-pointer"
            >
              ⚡ Trigger $1k Pay
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
                <div key={s.id} className="inset-card px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-400 border-1.5 border-black flex items-center justify-center flex-shrink-0 text-black">
                      <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-black dark:text-white">
                        Client paid <span className="font-mono font-black">${gross.toFixed(0)}</span>
                      </div>
                      <div className="text-[10px] font-mono text-black/60 dark:text-white/60 font-medium">
                        {time} · {(s as any).paymentMethod || s.transactionHash?.slice(0, 10) + '…'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px] font-black text-emerald-600 dark:text-emerald-400">+${earner.toFixed(2)}</div>
                    <div className="font-mono text-[10px] font-bold text-red-600 dark:text-red-400">−${backer.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          CHARGE CLIENT MODAL (Neo-Brutalist Sheet)
         ======================================================== */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full sm:max-w-sm bg-white dark:bg-[#18181B] border-t-[3px] sm:border-[3px] border-black dark:border-[#FFC800] shadow-[6px_6px_0px_#000] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-fade-in-up">
            <div className="w-12 h-1.5 rounded-full mx-auto bg-black dark:bg-white" />

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-black uppercase text-black dark:text-white tracking-tight">
                  CHARGE CLIENT
                </h3>
                <p className="text-[11px] text-black/70 dark:text-white/70 font-medium">
                  Generate your 90/10 automated payment link
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-black dark:text-white font-black bg-white dark:bg-[#27272A] border-2 border-black dark:border-white/30 shadow-[1.5px_1.5px_0px_#000] hover:bg-red-50 hover:text-red-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="label-caps mb-1 block" style={{ fontSize: '10px' }}>
                INVOICE AMOUNT (USDC)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-black dark:text-white font-mono font-black text-base">$</span>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-8 pr-16 py-2.5 rounded-xl text-black dark:text-white font-mono font-black text-lg bg-[#FAF9F5] dark:bg-[#121214] border-2 border-black dark:border-white/30 shadow-[2px_2px_0px_#000] focus:shadow-[3px_3px_0px_#FFC800] focus:outline-none"
                />
                <span className="absolute right-3.5 top-3 text-xs font-mono font-black text-black dark:text-white">USDC</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 2000, 5000].map((p) => (
                  <button
                    key={p}
                    onClick={() => setChargeAmount(p)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-black border-2 border-black transition-all ${
                      chargeAmount === p
                        ? 'bg-[#FFC800] text-black shadow-[2px_2px_0px_#000]'
                        : 'bg-white dark:bg-[#27272A] text-black dark:text-white hover:bg-[#FAF9F5]'
                    }`}
                  >
                    ${p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-caps mb-1 block" style={{ fontSize: '10px' }}>
                DESCRIPTION
              </label>
              <input
                type="text"
                value={chargeDesc}
                onChange={(e) => setChargeDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-black dark:text-white font-bold text-xs bg-[#FAF9F5] dark:bg-[#121214] border-2 border-black dark:border-white/30 shadow-[2px_2px_0px_#000] focus:outline-none"
              />
            </div>

            <div className="inset-card p-3 space-y-1.5">
              <div className="label-caps" style={{ fontSize: '9px' }}>AUTOMATIC SPLIT PREVIEW</div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-black dark:text-white">Direct to {payoutRailId} (90%)</span>
                <span className="font-mono font-black text-black dark:text-white">${(chargeAmount * 0.9).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-black/70 dark:text-white/70">Backers (10%)</span>
                <span className="font-mono font-black text-red-600 dark:text-red-400">${(chargeAmount * 0.1).toFixed(2)} USDC</span>
              </div>
              <div className="progress-track h-2.5 mt-1">
                <div className="progress-fill-periwinkle h-full" style={{ width: '90%' }} />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="w-full btn-periwinkle py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" strokeWidth={3} /> : <Copy className="h-4 w-4" strokeWidth={2.5} />}
                {copied ? 'LINK COPIED! ✓' : 'COPY PAYMENT LINK'}
              </button>

              <Link
                href={`/pay/BF-001?amount=${chargeAmount}&desc=${encodeURIComponent(chargeDesc)}`}
                className="w-full py-2.5 rounded-xl btn-ghost text-xs flex items-center justify-center gap-1.5"
              >
                OPEN PAY SCREEN <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
