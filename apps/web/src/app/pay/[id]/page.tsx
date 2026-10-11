'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  CreditCard,
  QrCode,
  Lock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  Smartphone,
  Globe,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAgreement,
  simulateSettlement,
  relayPayment,
  dollarsToMicro,
  microToDollars,
  getUserProfile,
  AgreementDTO,
  SettlementSimulationDTO,
  SettlementExecutionDTO,
  UserProfileDTO
} from '@/lib/api';

function MobilePaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const agreementId = (params?.id as string) || 'BF-001';
  const paramAmount = searchParams?.get('amount') ? Number(searchParams.get('amount')) : 1000;
  const paramDesc = searchParams?.get('desc') || 'Client Milestone & API Delivery';

  const [amount, setAmount] = useState<number>(paramAmount > 0 ? paramAmount : 1000);
  const [agreement, setAgreement] = useState<AgreementDTO | null>(null);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [simulation, setSimulation] = useState<SettlementSimulationDTO | null>(null);

  // Payment Method: 'card' | 'upi' | 'web3'
  const [method, setMethod] = useState<'card' | 'upi' | 'web3'>('card');

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 8821');
  const [cardHolder, setCardHolder] = useState('John Client');
  const [cardExpiry, setCardExpiry] = useState('11/27');
  const [cardCvv, setCardCvv] = useState('391');

  // UPI Form State
  const [clientUpi, setClientUpi] = useState('client@okhdfcbank');
  const [showQr, setShowQr] = useState(false);

  // Status State
  const [paying, setPaying] = useState(false);
  const [settled, setSettled] = useState(false);
  const [result, setResult] = useState<SettlementExecutionDTO | null>(null);
  const [authMsg, setAuthMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getAgreement(agreementId).then(setAgreement).catch(() => {});
    getUserProfile().then(setProfile).catch(() => {});
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
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B9DF8', '#A5B4FC', '#FF6B6B', '#ffffff']
    });
  };

  const handlePay = async () => {
    setPaying(true);
    setErrorMsg(null);

    let paymentMethodLabel = 'Credit/Debit Card (Visa •••• ' + cardNumber.slice(-4) + ')';
    let payerName = cardHolder || 'Client';

    if (method === 'upi') {
      paymentMethodLabel = `UPI (${clientUpi})`;
      payerName = clientUpi.split('@')[0] || 'Client';
      setAuthMsg('Initiating UPI 3D payment request...');
    } else if (method === 'card') {
      if (!cardNumber || cardNumber.length < 15) {
        setErrorMsg('Please enter a valid 16-digit card number');
        setPaying(false);
        return;
      }
      setAuthMsg('Processing card via 3D-Secure Global Gateway...');
    } else {
      paymentMethodLabel = 'Monad USDC (Passkey)';
      setAuthMsg('Authenticating biometric passkey...');
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
        } catch {
          // graceful demo fallback
        }
      }
    }

    try {
      const res = await relayPayment(
        agreementId,
        dollarsToMicro(amount),
        '0xClientPayer999900000000000000000000000001',
        paymentMethodLabel,
        payerName
      );
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

  const earnerDisplayName = profile?.name || agreement?.earnerName || 'Aman';
  const earnerPayoutDest = profile?.payoutIdentifier || 'Linked Payout Rail';

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
          Global Checkout Rail
        </span>
      </div>

      {/* Main Payment Container */}
      <div className="app-card-highlight p-5 space-y-4">
        <div className="space-y-0.5 text-center">
          <div className="text-[10px] text-periwinkle font-mono font-bold uppercase tracking-wider">
            Inflow Payment to {earnerDisplayName}
          </div>
          <h2 className="text-xl font-extrabold text-white">{paramDesc}</h2>
          <div className="text-[11px] text-slate-400 font-mono">
            Agreement #{agreementId} • Payout to: <span className="text-white font-semibold">{earnerPayoutDest}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="p-3.5 rounded-2xl bg-black/70 border border-white/10 text-center space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount Due</div>
          <div className="text-3xl font-black text-white flex items-center justify-center gap-1">
            <span className="text-xl text-slate-500 font-bold">$</span>
            <input
              type="number"
              disabled={paying || settled}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="bg-transparent text-center font-black text-white w-32 focus:outline-none"
            />
            <span className="text-sm text-periwinkle font-normal">USDC</span>
          </div>

          {!settled && (
            <div className="flex justify-center gap-1.5 pt-1.5">
              {[500, 1000, 2000, 5000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg transition-colors ${
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

        {/* Global Payment Method Selector */}
        {!settled && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Select Payment Method
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  method === 'card'
                    ? 'bg-periwinkle text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  method === 'upi'
                    ? 'bg-periwinkle text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('web3')}
                className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  method === 'web3'
                    ? 'bg-periwinkle text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>USDC</span>
              </button>
            </div>

            {/* METHOD 1: Debit / Credit Card Form */}
            {method === 'card' && (
              <div className="p-3.5 rounded-2xl bg-black/70 border border-white/10 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-[11px]">Global Cards (Visa / Mastercard)</span>
                  <div className="flex gap-1.5 text-[10px] font-mono text-periwinkle">
                    <span>VISA</span>
                    <span>MC</span>
                    <span>AMEX</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 8912 3456 8821"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl bg-black border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-periwinkle"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Name on card"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-white text-xs focus:outline-none focus:border-periwinkle"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">
                        Expires
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full mt-1 px-2.5 py-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full mt-1 px-2.5 py-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: UPI / QR Form */}
            {method === 'upi' && (
              <div className="p-3.5 rounded-2xl bg-black/70 border border-white/10 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-[11px]">Instant UPI / Mobile Banking</span>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-periwinkle text-[11px] font-semibold underline"
                  >
                    {showQr ? 'Hide QR' : 'Show Scan QR'}
                  </button>
                </div>

                {showQr ? (
                  <div className="p-4 bg-white rounded-2xl text-center space-y-2 max-w-[200px] mx-auto">
                    <div className="h-36 w-36 bg-neutral-900 mx-auto rounded-lg flex items-center justify-center text-white text-xs font-mono p-2 text-center">
                      [Dynamic UPI QR Code: ${amount} USDC]
                    </div>
                    <div className="text-[10px] text-neutral-800 font-bold">
                      Scan with Google Pay, PhonePe, Paytm
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">
                      Client UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={clientUpi}
                      onChange={(e) => setClientUpi(e.target.value)}
                      placeholder="yourname@okhdfcbank"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl bg-black border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-periwinkle"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Works with any Indian or international UPI-enabled app.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* METHOD 3: Web3 / USDC */}
            {method === 'web3' && (
              <div className="p-3.5 rounded-2xl bg-black/70 border border-white/10 space-y-2 animate-fade-in text-xs">
                <div className="text-slate-300 font-semibold text-[11px]">
                  Monad Testnet Gasless Passkey
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pay directly from your Web3 passkey wallet on Monad testnet with sub-second settlement and zero gas fees.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Automatic Split Preview (Crystal Clear) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-periwinkle" />
            Automatic Split at Settlement
          </div>

          <div className="p-3 rounded-2xl bg-black/60 border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">
                {earnerDisplayName} ({earnerPayoutDest.slice(0, 15)} - 90%)
              </span>
              <span className="font-mono font-bold text-periwinkle text-sm">
                ${earnerPayout.toFixed(2)} USDC
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Backers Syndicate Repayment (10%)</span>
              <span className="font-mono font-bold text-coral text-sm">
                ${backerPayout.toFixed(2)} USDC
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 flex items-center justify-between">
              <span>• Aman $20 • Priya $30 • Karan $50</span>
              <span className="text-periwinkle font-semibold">Zero Custody Rail</span>
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
              className="w-full btn-periwinkle py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-periwinkle/20 disabled:opacity-50"
            >
              {paying ? (
                <>
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{authMsg || 'Processing Payment...'}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>
                    Pay ${amount.toLocaleString()} USDC (
                    {method === 'card' ? 'Global Card' : method === 'upi' ? 'UPI' : 'Passkey'}
                    )
                  </span>
                </>
              )}
            </button>
            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3 text-periwinkle" />
              Direct execution via <code className="text-periwinkle">SettlementEngine.sol</code>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-periwinkle/10 border border-periwinkle/30 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-periwinkle font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              Payment & Inflow Split Completed!
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">${amount.toLocaleString()} USDC</strong> successfully settled via{' '}
              <strong className="text-periwinkle font-mono">{result?.paymentMethod || 'Global Payment Rail'}</strong>:
              <br />
              • <strong className="text-periwinkle">+${microToDollars(result?.earnerShare).toFixed(2)} USDC</strong> automatically routed to {earnerDisplayName}&apos;s {earnerPayoutDest}.
              <br />
              • <strong className="text-coral">-${microToDollars(result?.backerShareTotal).toFixed(2)} USDC</strong> pro-rata deducted to backer syndicate.
            </p>

            <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-slate-400 break-all border border-white/5">
              Tx: <span className="text-periwinkle">{result?.transactionHash}</span>
            </div>

            <Link
              href="/dashboard"
              className="btn-periwinkle w-full py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 text-center mt-2"
            >
              Back to Earner Wallet <ArrowRight className="h-3.5 w-3.5" />
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
          Loading Checkout Rail...
        </div>
      }
    >
      <MobilePaymentContent />
    </Suspense>
  );
}
