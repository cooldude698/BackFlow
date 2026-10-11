'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  CreditCard,
  QrCode,
  Building,
  KeyRound,
  ChevronLeft,
  Check,
  AlertCircle,
  Zap,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendOtp, verifyOtp, updatePayoutMethod, getUserProfile } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  // Wizard Step: 1 = Phone & Name, 2 = OTP, 3 = Connect Payout Rail
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [name, setName] = useState('Aman');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('9876543210');

  // OTP State
  const [otp, setOtp] = useState(['8', '4', '9', '2', '0', '1']);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(30);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Payout Method State
  const [payoutType, setPayoutType] = useState<'upi' | 'card' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('aman@upi');

  // Card details
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 8821');
  const [cardHolder, setCardHolder] = useState('Aman');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('482');

  // Bank details
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectedSuccess, setConnectedSuccess] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  // Load existing profile if any
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('backflow_user');
      if (stored) {
        setHasExistingSession(true);
      }
    }
    getUserProfile()
      .then((p) => {
        if (p.name) setName(p.name);
        if (p.phone) {
          const parts = p.phone.split(' ');
          if (parts.length > 1) {
            setCountryCode(parts[0]);
            setPhone(parts.slice(1).join(''));
          } else {
            setPhone(p.phone);
          }
        }
        if (p.payoutType === 'card' || p.payoutType === 'upi' || p.payoutType === 'bank') {
          setPayoutType(p.payoutType);
        }
        if (p.payoutIdentifier) {
          if (p.payoutType === 'upi') setUpiId(p.payoutIdentifier);
          if (p.payoutType === 'card') setCardNumber(p.payoutIdentifier);
        }
      })
      .catch(() => {});
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (step === 2 && otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, otpTimer]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const fullPhone = `${countryCode} ${phone}`;
      const res = await sendOtp(fullPhone, name);
      setReceivedOtp(res.otp || '849201');
      setOtp((res.otp || '849201').split(''));
      setStep(2);
      setOtpTimer(30);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const fullPhone = `${countryCode} ${phone}`;
      await verifyOtp(fullPhone, enteredOtp, name);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Connect Payout Rail
  const handleConnectPayout = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let identifier = upiId;
      let details: any = {};

      if (payoutType === 'upi') {
        if (!upiId || !upiId.includes('@')) {
          throw new Error('Please enter a valid UPI ID (e.g. name@upi)');
        }
        identifier = upiId;
        details = { upiId };
      } else if (payoutType === 'card') {
        if (!cardNumber || cardNumber.length < 15) {
          throw new Error('Please enter a valid 16-digit Card Number');
        }
        identifier = cardNumber;
        details = {
          cardNumberMasked: `${cardNumber.slice(0, 4)} •••• •••• ${cardNumber.slice(-4)}`,
          cardHolderName: cardHolder,
          cardExpiry
        };
      } else {
        if (!bankAccount) {
          throw new Error('Please enter your Bank Account Number');
        }
        identifier = `A/C: ${bankAccount.slice(-4)}`;
        details = { bankAccountNumber: bankAccount, ifscOrRouting: bankIfsc };
      }

      await updatePayoutMethod({
        payoutType,
        payoutIdentifier: identifier,
        payoutDetails: details,
        name
      });

      // Save to localStorage for client-side persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'backflow_user',
          JSON.stringify({
            name,
            phone: `${countryCode} ${phone}`,
            payoutType,
            payoutIdentifier: identifier
          })
        );
      }

      setConnectedSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B9DF8', '#A5B4FC', '#FF6B6B', '#ffffff']
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect payout rail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top back navigation */}
      <div className="flex items-center justify-between text-xs">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-300 font-semibold font-mono">Earner Onboarding</span>
          </div>
        )}
        <span className="text-[10px] font-mono text-periwinkle bg-periwinkle/10 px-2.5 py-0.5 rounded-full border border-periwinkle/20 font-bold">
          Step {step} of 3
        </span>
      </div>

      {/* Wizard Progress Bar */}
      <div className="grid grid-cols-3 gap-1.5 px-1">
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 1 ? 'bg-periwinkle' : 'bg-white/10'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 2 ? 'bg-periwinkle' : 'bg-white/10'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 3 ? 'bg-periwinkle' : 'bg-white/10'
          }`}
        />
      </div>

      {/* STEP 1: Name & Phone Number */}
      {step === 1 && (
        <div className="app-card-highlight p-6 space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-periwinkle tracking-wider font-bold">
              Account Setup
            </span>
            <h2 className="text-xl font-extrabold text-white">Enter Your Phone</h2>
            <p className="text-xs text-slate-400">
              We&apos;ll send an instant security code to verify your earner profile.
            </p>
          </div>

          {hasExistingSession && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Signed in as <strong className="text-white">{name}</strong></span>
              </div>
              <Link
                href="/dashboard"
                className="text-[11px] font-bold text-periwinkle hover:underline flex items-center gap-1"
              >
                Go to Wallet →
              </Link>
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-[11px] text-slate-400 uppercase font-semibold">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aman"
                className="w-full mt-1.5 px-3.5 py-3 rounded-xl bg-black border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-periwinkle"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 uppercase font-semibold">
                Mobile Number
              </label>
              <div className="flex gap-2 mt-1.5">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl px-2.5 py-3 text-xs text-white font-mono focus:outline-none focus:border-periwinkle"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+65">🇸🇬 +65</option>
                </select>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full px-3.5 py-3 rounded-xl bg-black border border-white/10 text-white font-mono font-medium text-sm focus:outline-none focus:border-periwinkle"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-coral/15 border border-coral/30 text-xs text-coral flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-periwinkle py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-periwinkle/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Get Security OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
            <Lock className="h-3 w-3 text-periwinkle" />
            End-to-end encrypted • Zero password vulnerability
          </div>
        </div>
      )}

      {/* STEP 2: 6-Digit OTP Verification */}
      {step === 2 && (
        <div className="app-card-highlight p-6 space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-periwinkle tracking-wider font-bold">
              Verification
            </span>
            <h2 className="text-xl font-extrabold text-white">Enter 6-Digit OTP</h2>
            <p className="text-xs text-slate-400">
              Code sent to <span className="font-mono text-white font-semibold">{countryCode} {phone}</span>
            </p>
          </div>

          {/* Simulated SMS Notification Banner */}
          <div className="p-3 rounded-xl bg-periwinkle/10 border border-periwinkle/30 space-y-1 text-xs">
            <div className="flex items-center justify-between text-periwinkle font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                SMS Code Delivered:
              </span>
              <button
                type="button"
                onClick={() => setOtp(['8', '4', '9', '2', '0', '1'])}
                className="underline hover:text-white font-bold"
              >
                Auto-fill
              </button>
            </div>
            <div className="font-mono font-bold text-white text-sm tracking-wider">
              849201
            </div>
          </div>

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const newOtp = [...otp];
                  newOtp[idx] = val;
                  setOtp(newOtp);
                  if (val && idx < 5) {
                    otpInputRefs.current[idx + 1]?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                    otpInputRefs.current[idx - 1]?.focus();
                  }
                }}
                className="w-11 h-13 text-center text-xl font-black rounded-xl bg-black border border-white/15 text-white focus:outline-none focus:border-periwinkle font-mono"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-coral/15 border border-coral/30 text-xs text-coral flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length !== 6}
              className="w-full btn-periwinkle py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-periwinkle/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify & Set Up Payout Rail</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-slate-400">
              {otpTimer > 0 ? (
                <span>Resend code in {otpTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setOtpTimer(30)}
                  className="text-periwinkle hover:underline font-semibold"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Connect Payout Rail (Where YOU receive the 90% net revenue) */}
      {step === 3 && (
        <div className="app-card-highlight p-6 space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-periwinkle tracking-wider font-bold">
              Automatic Payout Rail
            </span>
            <h2 className="text-xl font-extrabold text-white">Where Should We Send Your 90%?</h2>
            <p className="text-xs text-slate-400 leading-snug">
              Every time a client pays, your 90% automatically deposits here while 10% repays your backers.
            </p>
          </div>

          {/* Selector Tabs: UPI vs Card vs Bank */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setPayoutType('upi')}
              className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                payoutType === 'upi'
                  ? 'bg-periwinkle text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              UPI
            </button>

            <button
              type="button"
              onClick={() => setPayoutType('card')}
              className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                payoutType === 'card'
                  ? 'bg-periwinkle text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Debit Card
            </button>

            <button
              type="button"
              onClick={() => setPayoutType('bank')}
              className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                payoutType === 'bank'
                  ? 'bg-periwinkle text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              Bank A/C
            </button>
          </div>

          {/* Payout Form: UPI */}
          {payoutType === 'upi' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  Your UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. aman@okhdfcbank"
                  className="w-full mt-1 px-3.5 py-3 rounded-xl bg-black border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-periwinkle"
                />
              </div>

              {/* Fast handle suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {['@upi', '@okhdfcbank', '@oksbi', '@paytm', '@ybl'].map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    onClick={() => {
                      const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'aman';
                      setUpiId(`${prefix}${handle}`);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
                  >
                    {handle}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payout Form: Debit / Credit Card */}
          {payoutType === 'card' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  Debit / Credit Card Number (Visa / Mastercard)
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 8912 3456 8821"
                  className="w-full mt-1 px-3.5 py-3 rounded-xl bg-black border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-periwinkle"
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
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payout Form: Bank Account */}
          {payoutType === 'bank' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  Bank Account Number / IBAN
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 50100234891023"
                  className="w-full mt-1 px-3.5 py-3 rounded-xl bg-black border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-periwinkle"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  IFSC / Swift / Routing Code
                </label>
                <input
                  type="text"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                />
              </div>
            </div>
          )}

          {/* Protocol Split Connection Ribbon */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 flex items-start gap-2.5 text-xs">
            <Zap className="h-4 w-4 text-periwinkle flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white">BackFlow Protocol Connected:</strong> When any client pays, 90% will instantly deposit to this linked destination. 10% auto-repays your backers until the 2× cap is hit.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-coral/15 border border-coral/30 text-xs text-coral flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleConnectPayout}
            disabled={loading || connectedSuccess}
            className="w-full btn-periwinkle py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-periwinkle/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Connecting Rail...</span>
              </>
            ) : connectedSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Connected! Entering Portal...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Connect Payout Rail & Enter Portal</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
