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
  ChevronLeft,
  CreditCard,
  QrCode,
  Globe
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
  const paramDesc = searchParams?.get('desc') || 'Freelance Development Milestone';

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
      colors: ['#6366f1', '#818cf8', '#f43f5e', '#ffffff']
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
    <div className="space-y-3.5 animate-fade-in-up">
      {/* Top back button */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
        <span className="badge-periwinkle">Global Checkout Rail</span>
      </div>

      {/* Main Payment Container */}
      <div className="app-card-highlight p-6 space-y-4 relative overflow-hidden">
        {/* BG glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)' }}
        />

        {/* Invoice Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="h-11 w-11 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-white flex items-center justify-center p-0.5">
              <img
                src="/logo.jpeg"
                alt="BackFlow"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="label-caps text-indigo-600 font-bold" style={{ letterSpacing: '0.12em' }}>
            Inflow Payment to {earnerDisplayName}
          </div>
          <h2 className="text-[18px] font-extrabold text-slate-900 leading-tight">{paramDesc}</h2>
          <div className="mono text-[10px] text-slate-500 font-medium">
            Agreement #{agreementId} • Payout to: <span className="text-slate-900 font-semibold">{earnerPayoutDest}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="bg-white rounded-2xl p-4 text-center space-y-2 border border-slate-200/90 shadow-2xs">
          <div className="label-caps mb-1">Total Amount Due</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-slate-400 font-bold text-2xl">$</span>
            <input
              type="number"
              disabled={paying || settled}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="bg-transparent text-center font-black text-slate-900 text-[2.2rem] w-36 focus:outline-none amount-display"
            />
            <span className="font-bold text-base mono text-indigo-600">USDC</span>
          </div>

          {!settled && (
            <div className="flex justify-center gap-1.5 pt-1">
              {[500, 1000, 2000, 5000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] mono px-2.5 py-1 rounded-xl transition-all font-semibold ${
                    amount === preset
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            <div className="label-caps text-slate-500 font-bold">Select Payment Method</div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  method === 'card'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>USDC</span>
              </button>
            </div>

            {/* METHOD 1: Debit / Credit Card Form */}
            {method === 'card' && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold text-[11px] text-slate-800">Global Cards (Visa / Mastercard)</span>
                  <div className="flex gap-1.5 text-[10px] font-mono text-indigo-600 font-bold">
                    <span>VISA</span>
                    <span>MC</span>
                    <span>AMEX</span>
                  </div>
                </div>

                <div>
                  <label className="label-caps block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 8912 3456 8821"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label-caps block mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="label-caps block mb-1">Expires</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="label-caps block mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: UPI / QR Form */}
            {method === 'upi' && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-[11px]">Instant UPI / Mobile Banking</span>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-indigo-600 text-[11px] font-semibold underline"
                  >
                    {showQr ? 'Hide QR' : 'Show Scan QR'}
                  </button>
                </div>

                {showQr ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 max-w-[200px] mx-auto shadow-2xs">
                    <div className="h-36 w-36 bg-slate-900 mx-auto rounded-lg flex items-center justify-center text-white text-xs font-mono p-2 text-center">
                      [UPI QR CODE]
                    </div>
                    <div className="text-[10px] text-slate-500">Scan with any UPI App (GPay, PhonePe, Paytm)</div>
                  </div>
                ) : (
                  <div>
                    <label className="label-caps block mb-1">Payer UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={clientUpi}
                      onChange={(e) => setClientUpi(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* METHOD 3: Web3 Passkey */}
            {method === 'web3' && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 animate-fade-in text-xs">
                <div className="font-semibold text-slate-800 text-[11px]">Passkey & Web3 Settlement</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sign directly with your biometric FaceID / TouchID passkey. Atomic split executes on Monad.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Split Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 label-caps text-indigo-600 font-bold">
            <Sparkles className="h-3 w-3" />
            Automatic Split at Settlement
          </div>

          <div className="bg-white rounded-2xl p-3.5 space-y-2.5 border border-slate-200/80 shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-slate-700 font-medium">
                {earnerDisplayName} (90% to {earnerPayoutDest})
              </span>
              <span className="mono font-bold text-[14px] text-indigo-600">
                ${earnerPayout.toFixed(2)} USDC
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[12px] text-slate-700 font-medium">Backers Syndicate Repayment (10%)</span>
              <span className="mono font-bold text-[14px] text-coral">
                ${backerPayout.toFixed(2)} USDC
              </span>
            </div>

            {/* Split bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
              <div style={{ width: '90%', background: '#6366f1' }} />
              <div style={{ width: '10%', background: '#f43f5e' }} />
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] border-t border-slate-100">
              <span className="text-slate-400">• Aman $20 • Priya $30 • Karan $50</span>
              <span className="font-semibold text-indigo-600">Pro-Rata</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl flex items-center gap-2 text-[12px] bg-rose-50 border border-rose-200 text-rose-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CTA */}
        {!settled ? (
          <div className="space-y-2">
            <button
              onClick={handlePay}
              disabled={paying || amount <= 0}
              className="w-full btn-periwinkle py-4 rounded-2xl text-[14px] font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {paying ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              Direct execution via SettlementEngine.sol · Zero middleman custody
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 space-y-3 animate-scale-in bg-indigo-50/80 border border-indigo-200 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-[14px] text-indigo-700">
              <CheckCircle2 className="h-5 w-5" />
              Payment &amp; Inflow Split Completed!
            </div>
            <p className="text-[12px] text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-bold">${amount.toLocaleString()} USDC</strong> successfully settled via{' '}
              <strong className="text-indigo-600 font-mono font-bold">{result?.paymentMethod || 'Global Payment Rail'}</strong>:
              <br />• <strong className="text-indigo-600 font-bold">+${microToDollars(result?.earnerShare).toFixed(2)} USDC</strong> automatically routed to {earnerDisplayName}&apos;s {earnerPayoutDest}.
              <br />• <strong className="text-coral font-bold">-${microToDollars(result?.backerShareTotal).toFixed(2)} USDC</strong> pro-rata deducted to backer syndicate.
            </p>

            <div className="rounded-lg p-2.5 mono text-[10px] text-slate-600 break-all bg-white border border-slate-200 shadow-2xs">
              Tx: <span className="text-indigo-600 font-semibold">{result?.transactionHash}</span>
            </div>

            <Link href="/dashboard"
              className="btn-periwinkle w-full py-3 rounded-xl text-[12px] font-black flex items-center justify-center gap-1.5 mt-2"
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
    <Suspense fallback={
      <div className="py-20 text-center text-[12px] text-slate-400">Loading Checkout Rail…</div>
    }>
      <MobilePaymentContent />
    </Suspense>
  );
}
