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
import { triggerConfetti } from '@/lib/confetti';

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

  const handlePay = async () => {
    setPaying(true);
    setErrorMsg(null);

    let paymentMethodLabel = 'Credit/Debit Card (Visa •••• ' + cardNumber.slice(-4) + ')';
    let payerName = cardHolder || 'Client';

    if (method === 'upi') {
      paymentMethodLabel = `UPI (${clientUpi})`;
      payerName = clientUpi.split('@')[0] || 'Client';
      setAuthMsg('Initiating UPI payment rail...');
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
    <div className="space-y-3.5">
      {/* Top back button */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/dashboard"
          className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#27272A] border-2 border-black dark:border-white/30 shadow-[2px_2px_0px_#000] flex items-center gap-1 font-display font-black text-black dark:text-white text-[11px] uppercase hover:bg-[#FFC800] dark:hover:bg-[#FFC800] dark:hover:text-black transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={3} />
          Back
        </Link>
        <span className="badge-periwinkle">CHECKOUT RAIL</span>
      </div>

      {/* Main Payment Container */}
      <div className="app-card-highlight p-5 space-y-4 relative overflow-hidden">
        {/* Decorative corner dot grid & yellow square */}
        <div className="absolute top-3 right-3 w-8 h-8 dot-grid opacity-60 pointer-events-none" />
        <div className="w-3 h-3 bg-[#FFC800] border-1.5 border-black absolute left-3 top-3" />

        {/* Invoice Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-12 w-12 rounded-xl overflow-hidden border-2 border-black dark:border-[#FFC800] shadow-[2px_2px_0px_#000] bg-white flex items-center justify-center p-0.5">
              <img
                src="/logo.jpeg"
                alt="BackFlow"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="label-caps" style={{ fontSize: '10px' }}>
            INFLOW PAYMENT TO {earnerDisplayName.toUpperCase()}
          </div>
          <h2 className="font-display text-xl font-black uppercase tracking-tight text-black dark:text-white leading-tight">
            {paramDesc}
          </h2>
          <div className="font-mono text-[10px] text-black/70 dark:text-white/70 font-bold">
            Agreement #{agreementId} · Rail:{' '}
            <span className="text-black bg-[#FFC800] px-1 py-0.2 rounded border border-black">{earnerPayoutDest}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="inset-card p-4 text-center space-y-2">
          <div className="label-caps mb-1" style={{ fontSize: '9.5px' }}>TOTAL INVOICE AMOUNT</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-black dark:text-white font-mono font-black text-2xl">$</span>
            <input
              type="number"
              disabled={paying || settled}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="bg-transparent text-center font-display font-black text-black dark:text-white text-[2.5rem] w-40 focus:outline-none"
            />
            <span className="font-mono font-black text-xs text-black bg-[#FFC800] px-1.5 py-0.5 border border-black rounded">
              USDC
            </span>
          </div>

          {!settled && (
            <div className="flex justify-center gap-1.5 pt-1">
              {[500, 1000, 2000, 5000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] font-mono font-black px-2.5 py-1 rounded-lg border-2 border-black dark:border-white/30 transition-all ${
                    amount === preset
                      ? 'bg-[#FFC800] text-black shadow-[2px_2px_0px_#000]'
                      : 'bg-white dark:bg-[#27272A] text-black dark:text-white hover:bg-[#FAF9F5]'
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
            <div className="label-caps" style={{ fontSize: '10px' }}>SELECT PAYMENT METHOD</div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FAF9F5] dark:bg-[#121214] border-2 border-black dark:border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2 px-1 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  method === 'card'
                    ? 'bg-[#FFC800] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white border-2 border-transparent'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-2 px-1 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  method === 'upi'
                    ? 'bg-[#FFC800] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white border-2 border-transparent'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('web3')}
                className={`py-2 px-1 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  method === 'web3'
                    ? 'bg-[#FFC800] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white border-2 border-transparent'
                }`}
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Passkey</span>
              </button>
            </div>

            {/* METHOD 1: Card Form */}
            {method === 'card' && (
              <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-white dark:bg-[#18181B] shadow-[2px_2px_0px_#000] space-y-2.5 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="label-caps" style={{ fontSize: '9px' }}>GLOBAL CARDS</span>
                  <div className="flex gap-1 text-[9px] font-mono font-black text-black">
                    <span className="bg-[#FFC800] px-1 py-0.2 border border-black rounded">VISA</span>
                    <span className="bg-[#FFC800] px-1 py-0.2 border border-black rounded">MC</span>
                  </div>
                </div>

                <div>
                  <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>CARD NUMBER</span>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 8912 3456 8821"
                    className="w-full px-2.5 py-2 rounded-lg bg-[#FAF9F5] dark:bg-[#121214] border-1.5 border-black dark:border-white/20 text-black dark:text-white font-mono font-bold text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>HOLDER</span>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="John Client"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF9F5] dark:bg-[#121214] border-1.5 border-black dark:border-white/20 text-black dark:text-white font-bold text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>EXP</span>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-1.5 py-1.5 rounded-lg bg-[#FAF9F5] dark:bg-[#121214] border-1.5 border-black dark:border-white/20 text-black dark:text-white font-mono font-bold text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>CVV</span>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full px-1.5 py-1.5 rounded-lg bg-[#FAF9F5] dark:bg-[#121214] border-1.5 border-black dark:border-white/20 text-black dark:text-white font-mono font-bold text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: UPI / QR Form */}
            {method === 'upi' && (
              <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-white dark:bg-[#18181B] shadow-[2px_2px_0px_#000] space-y-2.5 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="label-caps" style={{ fontSize: '9px' }}>INSTANT UPI RAIL</span>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-black dark:text-white font-display font-black text-[10px] uppercase underline hover:text-[#FFC800]"
                  >
                    {showQr ? 'Enter VPA' : 'Show QR'}
                  </button>
                </div>

                {showQr ? (
                  <div className="p-3 bg-[#FAF9F5] dark:bg-[#121214] border-2 border-black rounded-xl text-center space-y-2 max-w-[180px] mx-auto">
                    <div className="h-32 w-32 bg-black mx-auto rounded-lg flex items-center justify-center text-white text-[11px] font-mono p-2 border-2 border-[#FFC800]">
                      [UPI QR SCAN]
                    </div>
                    <div className="text-[9.5px] font-bold text-black dark:text-white">Scan with GPay / PhonePe / Paytm</div>
                  </div>
                ) : (
                  <div>
                    <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>PAYER UPI ID (VPA)</span>
                    <input
                      type="text"
                      value={clientUpi}
                      onChange={(e) => setClientUpi(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full px-2.5 py-2 rounded-lg bg-[#FAF9F5] dark:bg-[#121214] border-1.5 border-black dark:border-white/20 text-black dark:text-white font-mono font-bold text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* METHOD 3: Web3 Passkey */}
            {method === 'web3' && (
              <div className="border-2 border-black dark:border-white/20 rounded-xl p-3 bg-white dark:bg-[#18181B] shadow-[2px_2px_0px_#000] space-y-1.5 animate-fade-in text-xs">
                <div className="label-caps" style={{ fontSize: '9px' }}>BIOMETRIC PASSKEY &amp; USDC</div>
                <p className="text-[11px] text-black/80 dark:text-white/80 font-medium leading-relaxed">
                  Sign directly with FaceID / TouchID passkey. Atomic 90/10 split executes in real time on Monad.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Split Preview */}
        <div className="space-y-1.5">
          <div className="label-caps" style={{ fontSize: '9.5px' }}>
            AUTOMATIC SPLIT AT SETTLEMENT
          </div>

          <div className="inset-card p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-black dark:text-white">
                {earnerDisplayName} (90% to {earnerPayoutDest})
              </span>
              <span className="font-mono font-black text-black dark:text-white">
                ${earnerPayout.toFixed(2)} USDC
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-black/70 dark:text-white/70">Backers Syndicate Repayment (10%)</span>
              <span className="font-mono font-black text-red-600 dark:text-red-400">
                ${backerPayout.toFixed(2)} USDC
              </span>
            </div>

            {/* Split bar */}
            <div className="progress-track h-2">
              <div className="progress-fill-periwinkle h-full" style={{ width: '90%' }} />
            </div>

            <div className="pt-1 flex items-center justify-between text-[9.5px] font-mono font-bold border-t border-black/10 dark:border-white/10 text-black/60 dark:text-white/60">
              <span>• Aman $20 • Priya $30 • Karan $50</span>
              <span className="text-black dark:text-white font-black uppercase">PRO-RATA</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl flex items-center gap-2 text-xs bg-red-100 border-2 border-black shadow-[2px_2px_0px_#000] text-red-900 font-bold">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CTA */}
        {!settled ? (
          <div className="space-y-2">
            {/* Split Neo-Brutalist Action Button */}
            <button
              onClick={handlePay}
              disabled={paying || amount <= 0}
              className="w-full flex items-stretch rounded-xl border-2 border-black dark:border-white/40 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFC800] overflow-hidden active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 group"
            >
              <div className="flex-1 bg-[#FFC800] group-hover:bg-[#FFD21A] py-3.5 text-center font-display font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 transition-colors">
                {paying ? (
                  <>
                    <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{authMsg || 'PROCESSING PAYMENT...'}</span>
                  </>
                ) : (
                  <span>
                    PAY ${amount.toLocaleString()} USDC ({method.toUpperCase()})
                  </span>
                )}
              </div>
              <div className="w-12 bg-black flex items-center justify-center text-white group-hover:bg-neutral-800 transition-colors">
                <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </div>
            </button>

            <div className="text-[10px] text-black/60 dark:text-white/60 text-center flex items-center justify-center gap-1 font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-black dark:text-white" strokeWidth={2.5} />
              Direct execution via SettlementEngine.sol · Zero middleman custody
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 space-y-3 bg-[#FFFBEB] dark:bg-[#1E1E22] border-2 border-black dark:border-[#FFC800] shadow-[3px_3px_0px_#000] animate-scale-in">
            <div className="flex items-center gap-2 font-display font-black text-sm uppercase text-black dark:text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={3} />
              PAYMENT &amp; INFLOW SPLIT COMPLETED!
            </div>
            <p className="text-xs text-black dark:text-white leading-relaxed font-medium">
              <strong className="font-mono font-black text-black dark:text-white">${amount.toLocaleString()} USDC</strong> successfully settled via{' '}
              <strong className="font-mono font-bold text-black dark:text-white">{result?.paymentMethod || 'Global Payment Rail'}</strong>:
              <br />• <strong className="font-mono font-black text-emerald-600 dark:text-emerald-400">+${microToDollars(result?.earnerShare).toFixed(2)} USDC</strong> automatically routed to {earnerDisplayName}&apos;s {earnerPayoutDest}.
              <br />• <strong className="font-mono font-black text-red-600 dark:text-red-400">-${microToDollars(result?.backerShareTotal).toFixed(2)} USDC</strong> pro-rata deducted to backer syndicate.
            </p>

            <div className="rounded-lg p-2 font-mono text-[10px] text-black dark:text-white break-all bg-white dark:bg-[#121214] border border-black dark:border-white/20 shadow-[1px_1px_0px_#000]">
              Tx: <span className="font-bold text-black dark:text-[#FFC800]">{result?.transactionHash}</span>
            </div>

            <Link
              href="/dashboard"
              className="btn-periwinkle w-full py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 mt-2"
            >
              BACK TO EARNER WALLET <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
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
      <div className="py-20 text-center font-display font-black text-xs uppercase text-black dark:text-white">
        LOADING CHECKOUT RAIL…
      </div>
    }>
      <MobilePaymentContent />
    </Suspense>
  );
}
