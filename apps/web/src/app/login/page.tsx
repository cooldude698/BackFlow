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
          if (p.payoutType === 'bank') setBankAccount(p.payoutIdentifier);
        }
      })
      .catch(() => {});
  }, []);

  // Timer countdown
  useEffect(() => {
    if (step === 2 && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, otpTimer]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 7) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const fullPhone = `${countryCode} ${phone}`;
      const res = await sendOtp(fullPhone);
      setReceivedOtp(res.otp || '849201');
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
        colors: ['#6366f1', '#818cf8', '#f43f5e', '#ffffff']
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect payout rail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between animate-fade-in-up">
      {/* Top back navigation & step progress - Stays pinned at top */}
      <div className="space-y-2.5 px-0.5 flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-600 font-bold tracking-tight">Earner Onboarding</span>
            </div>
          )}
          <span className="badge-periwinkle font-mono text-[10px]">Step {step} of 3</span>
        </div>

        {/* Wizard Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        </div>
      </div>

      {/* Middle section: Card is centered in the remaining height */}
      <div className="flex-1 flex flex-col justify-center my-auto py-3">
        {/* STEP 1: Name & Phone Number */}
        {step === 1 && (
        <div className="app-card-highlight p-6 space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="label-caps text-indigo-600 font-bold">Account Setup</span>
            <h2 className="text-xl font-extrabold text-slate-900">Enter Your Phone</h2>
            <p className="text-xs text-slate-500">
              We&apos;ll send an instant security code to verify your earner profile.
            </p>
          </div>

          {hasExistingSession && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-slate-700 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Signed in as <strong className="text-slate-900">{name}</strong></span>
              </div>
              <Link
                href="/dashboard"
                className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Go to Wallet →
              </Link>
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="label-caps block mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aman"
                className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="label-caps block mb-1">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
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
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-medium text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-periwinkle py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

          <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1 font-medium">
            <Lock className="h-3 w-3 text-indigo-600" />
            End-to-end encrypted • Zero password vulnerability
          </div>
        </div>
      )}

      {/* STEP 2: 6-Digit OTP Verification */}
      {step === 2 && (
        <div className="app-card-highlight p-6 space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="label-caps text-indigo-600 font-bold">Verification</span>
            <h2 className="text-xl font-extrabold text-slate-900">Enter 6-Digit OTP</h2>
            <p className="text-xs text-slate-500">
              Code sent to <span className="font-mono text-slate-900 font-semibold">{countryCode} {phone}</span>
            </p>
          </div>

          {/* SMS Notification Banner */}
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1 text-xs">
            <div className="flex items-center justify-between text-indigo-700 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                SMS Code Delivered:
              </span>
              <button
                type="button"
                onClick={() => setOtp((receivedOtp || '849201').split(''))}
                className="underline hover:text-indigo-900 font-bold"
              >
                Auto-fill
              </button>
            </div>
            <div className="font-mono font-bold text-slate-900 text-sm tracking-wider">
              {receivedOtp || '849201'}
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
                className="w-11 h-13 text-center text-xl font-black rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono shadow-2xs"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length !== 6}
              className="w-full btn-periwinkle py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Connect Payout Rail */}
      {step === 3 && (
        <div className="app-card-highlight p-6 space-y-5 animate-fade-in">
          <div className="space-y-1">
            <span className="label-caps text-indigo-600 font-bold">Automatic Payout Rail</span>
            <h2 className="text-xl font-extrabold text-slate-900">Where Should We Send Your 90%?</h2>
            <p className="text-xs text-slate-500 leading-snug">
              Every time a client pays, your 90% automatically deposits here while 10% repays your backers.
            </p>
          </div>

          {/* Selector Tabs: UPI vs Card vs Bank */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPayoutType('upi')}
              className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                payoutType === 'upi'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                <label className="label-caps block mb-1">Your UPI ID (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. aman@okhdfcbank"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500"
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
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
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
                <label className="label-caps block mb-1">Debit / Credit Card Number (Visa / Mastercard)</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 8912 3456 8821"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500"
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
                <div>
                  <label className="label-caps block mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payout Form: Bank Account */}
          {payoutType === 'bank' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="label-caps block mb-1">Bank Account Number / IBAN</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 50100234891023"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="label-caps block mb-1">IFSC / Swift / Routing Code</label>
                <input
                  type="text"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Protocol Split Connection Ribbon */}
          <div className="inset-card p-3.5 flex items-start gap-2.5 text-xs">
            <Zap className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-snug">
              <strong className="text-slate-900 font-bold">BackFlow Protocol Connected:</strong> When any client pays, 90% will instantly deposit to this linked destination. 10% auto-repays your backers until the 2× cap is hit.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleConnectPayout}
            disabled={loading || connectedSuccess}
            className="w-full btn-periwinkle py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Connecting Rail...</span>
              </>
            ) : connectedSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Connected! Opening Wallet...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Connect Payout Rail &amp; Enter Portal</span>
              </>
            )}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
