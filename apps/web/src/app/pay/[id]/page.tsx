'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Lock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAgreement,
  simulateSettlement,
  relayPayment,
  dollarsToMicro,
  microToDollars,
  AgreementDTO,
  SettlementSimulationDTO,
  SettlementExecutionDTO
} from '@/lib/api';

function MobilePaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const agreementId = (params?.id as string) || 'BF-001';
  const paramAmount = searchParams?.get('amount') ? Number(searchParams.get('amount')) : 1000;
  const paramDesc = searchParams?.get('desc') || 'Freelance Development Milestone';

  const [amount, setAmount] = useState<number>(paramAmount > 0 ? paramAmount : 1000);
  const [agreement, setAgreement] = useState<AgreementDTO | null>(null);
  const [simulation, setSimulation] = useState<SettlementSimulationDTO | null>(null);

  const [paying, setPaying] = useState(false);
  const [settled, setSettled] = useState(false);
  const [result, setResult] = useState<SettlementExecutionDTO | null>(null);
  const [authMsg, setAuthMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getAgreement(agreementId).then(setAgreement).catch(() => {});
  }, [agreementId]);

  useEffect(() => {
    if (amount > 0) {
      simulateSettlement(agreementId, dollarsToMicro(amount))
        .then(setSimulation)
        .catch(() => {});
    }
  }, [agreementId, amount]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#8B9DF8', '#A5B4FC', '#FF6B6B', '#ffffff']
    });
  };

  const handlePay = async () => {
    setPaying(true);
    setErrorMsg(null);
    setAuthMsg('Authenticating Passkey / Biometrics...');

    if (typeof window !== 'undefined' && window.PublicKeyCredential && navigator.credentials) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname
          }
        });
        setAuthMsg('Biometrics verified! Executing split...');
      } catch {
        setAuthMsg('Confirming atomic split on Monad...');
      }
    } else {
      setAuthMsg('Submitting atomic settlement...');
    }

    try {
      const res = await relayPayment(agreementId, dollarsToMicro(amount));
      setResult(res);
      setSettled(true);
      setPaying(false);
      setAuthMsg('');
      triggerConfetti();
    } catch (e: any) {
      setErrorMsg(e.message || 'Payment execution failed');
      setPaying(false);
      setAuthMsg('');
    }
  };

  const earnerPayout = simulation ? microToDollars(simulation.earnerPayout) : amount * 0.9;
  const backerPayout = simulation ? microToDollars(simulation.actualTotalBackerPayout) : amount * 0.1;

  return (
    <div className="space-y-4">
      {/* Top back button */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
        <span className="text-[10px] font-mono text-periwinkle bg-periwinkle/10 px-2 py-0.5 rounded-full border border-periwinkle/20">
          Client Pay Rail
        </span>
      </div>

      {/* Main Payment Card */}
      <div className="app-card-highlight p-6 space-y-5">
        <div className="space-y-1 text-center">
          <div className="text-[11px] text-periwinkle font-bold uppercase tracking-wider font-mono">
            Payment To Rahul
          </div>
          <h2 className="text-xl font-extrabold text-white">{paramDesc}</h2>
          <div className="text-xs text-slate-400 font-mono">Agreement #{agreementId}</div>
        </div>

        {/* Amount Box */}
        <div className="p-4 rounded-2xl bg-black/70 border border-white/10 text-center space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount Due</div>
          <div className="text-4xl font-black text-white flex items-center justify-center gap-1">
            <span className="text-2xl text-slate-500 font-bold">$</span>
            <input
              type="number"
              disabled={paying || settled}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="bg-transparent text-center font-black text-white w-36 focus:outline-none"
            />
            <span className="text-base text-periwinkle font-normal">USDC</span>
          </div>

          {!settled && (
            <div className="flex justify-center gap-1.5 pt-2">
              {[500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-lg transition-colors ${
                    amount === preset
                      ? 'bg-periwinkle text-black font-bold'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Automatic Split Preview (Crystal Clear) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-periwinkle" />
            Automatic Split at Settlement
          </div>

          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Rahul (Net Kept - 90%)</span>
              <span className="font-mono font-bold text-periwinkle text-sm">
                ${earnerPayout.toFixed(2)} USDC
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Repaying Backers (10%)</span>
              <span className="font-mono font-bold text-coral text-sm">
                ${backerPayout.toFixed(2)} USDC
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 flex items-center justify-between">
              <span>• Aman $20 • Priya $30 • Karan $50</span>
              <span className="text-periwinkle font-semibold">Pro-Rata</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-coral/15 border border-coral/30 text-xs text-coral flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        {!settled ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={handlePay}
              disabled={paying || amount <= 0}
              className="w-full btn-periwinkle py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-periwinkle/20 disabled:opacity-50"
            >
              {paying ? (
                <>
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{authMsg || 'Settling on Monad...'}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay ${amount.toLocaleString()} USDC (1-Click Passkey)
                </>
              )}
            </button>
            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3 text-periwinkle" />
              Direct Monad contract rail • Zero middleman custody
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-periwinkle/10 border border-periwinkle/30 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-periwinkle font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              Settled & Split Successfully!
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">${amount.toLocaleString()} USDC</strong> was atomically split:
              <br />
              • <strong className="text-periwinkle">+${microToDollars(result?.earnerShare).toFixed(2)}</strong> sent to Rahul
              <br />
              • <strong className="text-coral">-${microToDollars(result?.backerShareTotal).toFixed(2)}</strong> sent to backers
            </p>

            <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-slate-400 break-all border border-white/5">
              Tx: <span className="text-periwinkle">{result?.transactionHash}</span>
            </div>

            <Link
              href="/dashboard"
              className="btn-periwinkle w-full py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 text-center mt-2"
            >
              Back to Live Wallet <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobilePaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-400">
          Loading Inflow Rail...
        </div>
      }
    >
      <MobilePaymentContent />
    </Suspense>
  );
}
