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
  Lock,
  User,
  Mail,
  Camera,
  Smartphone
} from 'lucide-react';
import { triggerConfetti } from '@/lib/confetti';
import { sendOtp, verifyOtp, updatePayoutMethod, getUserProfile } from '@/lib/api';
import { useLoginStep } from '@/context/LoginStepContext';

export default function LoginPage() {
  const router = useRouter();

  // Wizard Step synchronized with MobileFrame header
  const { step, setStep } = useLoginStep();

  // Form states
  const [name, setName] = useState('Aman');
  const [email, setEmail] = useState('aman@example.com');
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

  // Load existing profile if any & reset step to 1
  useEffect(() => {
    setStep(1);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('backflow_user');
      if (stored) {
        setHasExistingSession(true);
        try {
          const parsed = JSON.parse(stored);
          if (parsed.email) setEmail(parsed.email);
        } catch {}
      }
    }
    getUserProfile()
      .then((p) => {
        if (p.name) setName(p.name);
        if (p.email) setEmail(p.email);
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
      const res = await sendOtp(fullPhone, name, email);
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
      await verifyOtp(fullPhone, enteredOtp, name, email);
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
        name,
        email
      });

      // Save to localStorage for client-side persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'backflow_user',
          JSON.stringify({
            name,
            email,
            phone: `${countryCode} ${phone}`,
            payoutType,
            payoutIdentifier: identifier
          })
        );
      }

      setConnectedSuccess(true);
      triggerConfetti();

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
    <div className="w-full flex-1 flex flex-col justify-between">
      {/* Top Navigation & Step Indicator (Inspired by brutalist mobile screen header) */}
      <div className="flex items-center justify-between pb-3 flex-shrink-0">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as 1 | 2)}
            className="h-8 w-8 rounded-lg bg-white dark:bg-[#18181B] border-2 border-black dark:border-white/30 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] flex items-center justify-center text-black dark:text-white hover:bg-[#FFC800] dark:hover:bg-[#FFC800] dark:hover:text-black transition-colors active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Go back"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={3} />
          </button>
        ) : (
          <div className="h-8 w-8 rounded-lg bg-white dark:bg-[#18181B] border-2 border-black dark:border-white/30 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] flex items-center justify-center font-display font-black text-xs text-black dark:text-white">
            BF
          </div>
        )}

        {/* 3 Step Pill Indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all border-1.5 border-black dark:border-white/40 ${
                step >= s
                  ? 'w-6 bg-[#FFC800] shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#FFC800]'
                  : 'w-2 bg-white dark:bg-white/20'
              }`}
            />
          ))}
        </div>

        {hasExistingSession && step === 1 ? (
          <Link
            href="/dashboard"
            className="font-display font-black text-[11px] uppercase tracking-wider text-black dark:text-white underline underline-offset-4 hover:text-[#FFC800] dark:hover:text-[#FFC800]"
          >
            SKIP
          </Link>
        ) : (
          <span className="font-mono text-[10px] font-black uppercase text-black/60 dark:text-white/60">
            0{step}/03
          </span>
        )}
      </div>

      {/* Main Form Content */}
      <div className="flex-1 flex flex-col justify-center my-auto py-2">
        {/* ========================================================
            STEP 1: CREATE YOUR PROFILE (Matching Reference Screen 1)
           ======================================================== */}
        {step === 1 && (
          <div className="app-card-highlight p-5 space-y-4 animate-fade-in relative overflow-hidden dark:bg-[#18181B] dark:border-[#27272A] dark:shadow-[4px_4px_0px_#FFC800]">
            {/* Decorative dot matrix corner */}
            <div className="absolute top-3 right-3 w-8 h-8 dot-grid opacity-70 pointer-events-none" />

            {/* Title Section */}
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-black dark:text-white leading-none">
                CREATE YOUR PROFILE
              </h1>
              <p className="text-xs text-black/70 dark:text-white/70 font-medium leading-snug pt-1">
                Set up your verified earner profile to unlock 90/10 automated payment splits.
              </p>
            </div>

            {/* Stylized Neo-Brutalist Avatar Box (Direct inspiration from reference illustration) */}
            <div className="flex items-center justify-center py-2 relative">
              {/* Floating dot matrix on left */}
              <div className="w-10 h-10 dot-grid opacity-60 absolute left-6 top-2 pointer-events-none" />
              {/* Floating yellow accent square */}
              <div className="w-3 h-3 bg-[#FFC800] border-2 border-black dark:border-white/30 absolute right-10 top-3" />

              <div className="relative">
                <div className="w-24 h-24 bg-[#FFC800] border-[2.5px] border-black dark:border-white/20 rounded-2xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFC800] flex items-center justify-center overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-[#121214] border-2 border-black dark:border-white/30 flex items-center justify-center">
                    <User className="h-10 w-10 text-black dark:text-white" strokeWidth={2.5} />
                  </div>
                </div>
                {/* Camera icon button attached */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-black dark:bg-[#FFC800] text-white dark:text-black rounded-lg border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_#FFC800] dark:shadow-[1.5px_1.5px_0px_#000]">
                  <Camera className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {hasExistingSession && (
              <div className="p-2.5 rounded-xl bg-[#FFFBEB] dark:bg-[#1E1E24] border-2 border-black dark:border-[#27272A] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black dark:border-white animate-pulse" />
                  <span className="font-bold text-black dark:text-white">Active session: {name}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="font-display font-black text-[11px] uppercase bg-black dark:bg-[#FFC800] text-white dark:text-black px-2 py-0.5 rounded border border-black hover:bg-[#FFC800] dark:hover:bg-[#FFD21A] hover:text-black transition-colors"
                >
                  Enter →
                </Link>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-3">
              {/* Full Name Input Box */}
              <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2.5 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus-within:shadow-[3px_3px_0px_#FFC800] focus-within:bg-[#FFFBEB] dark:focus-within:bg-[#1E1E24] transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3.5 w-3.5 text-black dark:text-[#FFC800]" strokeWidth={2.5} />
                  <span className="label-caps dark:text-white/70" style={{ fontSize: '10px' }}>FULL NAME</span>
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aman"
                  className="w-full bg-transparent text-sm font-bold text-black dark:text-white focus:outline-none"
                />
              </div>

              {/* Email Address Input Box */}
              <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2.5 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus-within:shadow-[3px_3px_0px_#FFC800] focus-within:bg-[#FFFBEB] dark:focus-within:bg-[#1E1E24] transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-3.5 w-3.5 text-black dark:text-[#FFC800]" strokeWidth={2.5} />
                  <span className="label-caps dark:text-white/70" style={{ fontSize: '10px' }}>EMAIL ADDRESS</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aman@example.com"
                  className="w-full bg-transparent text-sm font-bold text-black dark:text-white focus:outline-none font-mono"
                />
              </div>

              {/* Phone Number Input Box */}
              <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2.5 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus-within:shadow-[3px_3px_0px_#FFC800] focus-within:bg-[#FFFBEB] dark:focus-within:bg-[#1E1E24] transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-3.5 w-3.5 text-black dark:text-[#FFC800]" strokeWidth={2.5} />
                  <span className="label-caps dark:text-white/70" style={{ fontSize: '10px' }}>PHONE NUMBER</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#FAF9F5] dark:bg-[#18181B] border-1.5 border-black dark:border-[#27272A] rounded-md px-1.5 py-0.5 text-xs font-mono font-black text-black dark:text-white focus:outline-none"
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
                    className="w-full bg-transparent text-sm font-mono font-bold text-black dark:text-white focus:outline-none tracking-wider"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 border-2 border-black dark:border-red-500 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_red] text-xs text-red-900 dark:text-red-200 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Brutalist Split Button (Yellow body + Black Arrow Block on Right) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-stretch rounded-xl border-2 border-black dark:border-white/30 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFC800] overflow-hidden active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 group"
              >
                <div className="flex-1 bg-[#FFC800] group-hover:bg-[#FFD21A] py-3.5 text-center font-display font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 transition-colors">
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>SENDING CODE...</span>
                    </>
                  ) : (
                    <span>CONTINUE</span>
                  )}
                </div>
                <div className="w-12 bg-black dark:bg-[#121214] flex items-center justify-center text-white dark:text-[#FFC800] group-hover:bg-neutral-800 dark:group-hover:bg-neutral-900 transition-colors">
                  <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </div>
              </button>
            </form>

            {/* Bottom Hazard Stripe Accent (Straight from reference image bottom banner) */}
            <div className="pt-2">
              <div className="hazard-bar h-3 rounded-md w-full" />
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: VERIFY YOUR PHONE NUMBER (Matching Reference Screen 2)
           ======================================================== */}
        {step === 2 && (
          <div className="app-card-highlight p-5 space-y-4 animate-fade-in relative overflow-hidden dark:bg-[#18181B] dark:border-[#27272A] dark:shadow-[4px_4px_0px_#FFC800]">
            {/* Decorative dot matrix corner */}
            <div className="absolute top-3 right-3 w-8 h-8 dot-grid opacity-70 pointer-events-none" />

            {/* Title Section */}
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-black dark:text-white leading-none">
                VERIFY YOUR PHONE NUMBER
              </h1>
              <p className="text-xs text-black/70 dark:text-white/70 font-medium leading-snug pt-1">
                We have sent a 6-digit verification code to{' '}
                <span className="font-mono text-black font-extrabold bg-[#FFC800] px-1 py-0.5 border border-black rounded">
                  {countryCode} {phone}
                </span>
              </p>
            </div>

            {/* Center Phone Graphic with Asterisk Badge (Inspired directly by reference screen 2) */}
            <div className="flex items-center justify-center py-2 relative">
              {/* Radiating sparkle lines */}
              <div className="absolute left-8 top-6 w-3 h-0.5 bg-black dark:bg-white/40 rotate-45" />
              <div className="absolute left-7 top-10 w-3 h-0.5 bg-black dark:bg-white/40 -rotate-12" />
              <div className="absolute right-8 top-6 w-3 h-0.5 bg-black dark:bg-white/40 -rotate-45" />
              <div className="absolute right-7 top-10 w-3 h-0.5 bg-black dark:bg-white/40 rotate-12" />
              {/* Floating yellow square */}
              <div className="w-3 h-3 bg-[#FFC800] border-2 border-black dark:border-white/30 absolute right-12 bottom-3" />

              {/* Phone Silhouette Graphic */}
              <div className="w-28 h-36 bg-white dark:bg-[#121214] border-[2.5px] border-black dark:border-white/30 rounded-2xl shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFC800] p-2 flex flex-col items-center justify-between relative">
                {/* Speaker slit */}
                <div className="w-6 h-1 bg-black dark:bg-white/40 rounded-full" />

                {/* Asterisk Badge inside phone */}
                <div className="w-full bg-[#FFC800] border-2 border-black rounded-xl py-2 px-1 text-center shadow-[2px_2px_0px_#000]">
                  <span className="font-display font-black text-xl tracking-widest text-black">
                    ****
                  </span>
                </div>

                {/* Home bar slit */}
                <div className="w-10 h-1 bg-black dark:bg-white/40 rounded-full" />
              </div>
            </div>

            {/* SMS Notification Quick Code Pill */}
            <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#1E1E24] border-2 border-black dark:border-[#27272A] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-black dark:text-white">
                <Sparkles className="h-3.5 w-3.5 text-[#FFC800]" fill="#FFC800" stroke="#000" />
                <span>Delivered Code:</span>
                <span className="font-mono font-black bg-white dark:bg-[#121214] px-2 py-0.5 rounded border border-black dark:border-[#27272A] tracking-widest text-black dark:text-[#FFC800]">
                  {receivedOtp || '849201'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtp((receivedOtp || '849201').split(''))}
                className="font-display font-black text-[10px] uppercase bg-[#FFC800] hover:bg-[#FFD21A] text-black px-2 py-1 rounded border border-black transition-colors"
              >
                Auto-fill
              </button>
            </div>

            {/* 6 Individual Square OTP Boxes */}
            <div className="flex justify-between gap-1.5 py-1">
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
                  className="w-11 h-13 text-center text-xl font-display font-black rounded-xl bg-white dark:bg-[#121214] border-2 border-black dark:border-[#27272A] text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus:shadow-[3px_3px_0px_#FFC800] focus:bg-[#FFFBEB] dark:focus:bg-[#1E1E24] focus:outline-none transition-all"
                />
              ))}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 border-2 border-black dark:border-red-500 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_red] text-xs text-red-900 dark:text-red-200 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Resend Code Prompt */}
            <div className="text-center text-xs font-bold text-black/70 dark:text-white/70">
              Didn&apos;t receive code?{' '}
              {otpTimer > 0 ? (
                <span className="font-mono text-red-600 dark:text-red-400 font-black">
                  RESEND (00:{otpTimer.toString().padStart(2, '0')})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setOtpTimer(30)}
                  className="font-display font-black text-black dark:text-white underline underline-offset-4 hover:text-[#FFC800] dark:hover:text-[#FFC800]"
                >
                  RESEND CODE NOW
                </button>
              )}
            </div>

            {/* Brutalist Split Button (Yellow + Black Arrow) */}
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex items-stretch rounded-xl border-2 border-black dark:border-white/30 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFC800] overflow-hidden active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 group"
            >
              <div className="flex-1 bg-[#FFC800] group-hover:bg-[#FFD21A] py-3.5 text-center font-display font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 transition-colors">
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <span>VERIFY &amp; CONTINUE</span>
                )}
              </div>
              <div className="w-12 bg-black dark:bg-[#121214] flex items-center justify-center text-white dark:text-[#FFC800] group-hover:bg-neutral-800 dark:group-hover:bg-neutral-900 transition-colors">
                <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </div>
            </button>
          </div>
        )}

        {/* ========================================================
            STEP 3: AUTOMATIC PAYOUT RAIL (Matching Reference Screen 3)
           ======================================================== */}
        {step === 3 && (
          <div className="app-card-highlight p-5 space-y-4 animate-fade-in relative overflow-hidden dark:bg-[#18181B] dark:border-[#27272A] dark:shadow-[4px_4px_0px_#FFC800]">
            {/* Decorative dot matrix corner */}
            <div className="absolute top-3 right-3 w-8 h-8 dot-grid opacity-70 pointer-events-none" />

            {/* Title Section */}
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-black dark:text-white leading-none">
                AUTOMATIC PAYOUT RAIL
              </h1>
              <p className="text-xs text-black/70 dark:text-white/70 font-medium leading-snug pt-1">
                Where should we deposit your 90% revenue share whenever a client pays?
              </p>
            </div>

            {/* Feature Bullet Points (Styled after location permission screen) */}
            <div className="space-y-2 py-1">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#121214] border-2 border-black dark:border-[#27272A] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800]">
                <div className="w-7 h-7 rounded-lg bg-[#FFC800] border-1.5 border-black flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-black" strokeWidth={2.5} />
                </div>
                <div className="text-[11px] font-bold text-black dark:text-white leading-tight">
                  Instant 90% deposit on every payment settlement
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#121214] border-2 border-black dark:border-[#27272A] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800]">
                <div className="w-7 h-7 rounded-lg bg-[#FFC800] border-1.5 border-black flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-4 w-4 text-black" strokeWidth={2.5} />
                </div>
                <div className="text-[11px] font-bold text-black dark:text-white leading-tight">
                  10% automatically auto-repays your backers up to 2× cap
                </div>
              </div>
            </div>

            {/* Selector Tabs: UPI vs Card vs Bank (Brutalist pill tabs) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FAF9F5] dark:bg-[#121214] border-2 border-black dark:border-[#27272A] text-xs">
              <button
                type="button"
                onClick={() => setPayoutType('upi')}
                className={`py-2 px-1 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'upi'
                    ? 'bg-[#FFC800] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white border-2 border-transparent'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" strokeWidth={2.5} />
                UPI
              </button>

              <button
                type="button"
                onClick={() => setPayoutType('card')}
                className={`py-2 px-1 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'card'
                    ? 'bg-[#FFC800] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white border-2 border-transparent'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" strokeWidth={2.5} />
                Debit
              </button>

              <button
                type="button"
                onClick={() => setPayoutType('bank')}
                className={`py-2 px-1 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'bank'
                    ? 'bg-[#FFC800] text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white border-2 border-transparent'
                }`}
              >
                <Building className="h-3.5 w-3.5" strokeWidth={2.5} />
                Bank
              </button>
            </div>

            {/* Payout Form: UPI */}
            {payoutType === 'upi' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2.5 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus-within:shadow-[3px_3px_0px_#FFC800] focus-within:bg-[#FFFBEB] dark:focus-within:bg-[#1E1E24] transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="h-3.5 w-3.5 text-black dark:text-[#FFC800]" strokeWidth={2.5} />
                    <span className="label-caps dark:text-white/70" style={{ fontSize: '10px' }}>YOUR UPI ID (VPA)</span>
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. aman@okhdfcbank"
                    className="w-full bg-transparent text-sm font-mono font-bold text-black dark:text-white focus:outline-none"
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
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-[#18181B] text-black dark:text-white border-1.5 border-black dark:border-[#27272A] shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#FFC800] hover:bg-[#FFC800] dark:hover:bg-[#FFC800] dark:hover:text-black transition-colors"
                    >
                      {handle}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payout Form: Card */}
            {payoutType === 'card' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2.5 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus-within:shadow-[3px_3px_0px_#FFC800] focus-within:bg-[#FFFBEB] dark:focus-within:bg-[#1E1E24] transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-black dark:text-[#FFC800]" strokeWidth={2.5} />
                    <span className="label-caps dark:text-white/70" style={{ fontSize: '10px' }}>CARD NUMBER</span>
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 8912 3456 8821"
                    className="w-full bg-transparent text-sm font-mono font-bold text-black dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800]">
                    <span className="label-caps dark:text-white/70 block mb-0.5" style={{ fontSize: '9px' }}>HOLDER</span>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Aman"
                      className="w-full bg-transparent text-xs font-bold text-black dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800]">
                    <span className="label-caps dark:text-white/70 block mb-0.5" style={{ fontSize: '9px' }}>EXPIRY</span>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-transparent text-xs font-mono font-bold text-black dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payout Form: Bank */}
            {payoutType === 'bank' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2.5 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus-within:shadow-[3px_3px_0px_#FFC800] focus-within:bg-[#FFFBEB] dark:focus-within:bg-[#1E1E24] transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="h-3.5 w-3.5 text-black dark:text-[#FFC800]" strokeWidth={2.5} />
                    <span className="label-caps dark:text-white/70" style={{ fontSize: '10px' }}>ACCOUNT NUMBER</span>
                  </div>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="50100234891023"
                    className="w-full bg-transparent text-sm font-mono font-bold text-black dark:text-white focus:outline-none"
                  />
                </div>

                <div className="border-2 border-black dark:border-[#27272A] rounded-xl p-2.5 bg-white dark:bg-[#121214] shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#FFC800] focus-within:shadow-[3px_3px_0px_#FFC800] focus-within:bg-[#FFFBEB] dark:focus-within:bg-[#1E1E24] transition-all">
                  <span className="label-caps dark:text-white/70 block mb-1" style={{ fontSize: '10px' }}>IFSC / ROUTING CODE</span>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full bg-transparent text-xs font-mono font-bold text-black dark:text-white focus:outline-none uppercase"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 border-2 border-black dark:border-red-500 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_red] text-xs text-red-900 dark:text-red-200 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Brutalist Split Button (Yellow + Black Arrow) */}
            <button
              type="button"
              onClick={handleConnectPayout}
              disabled={loading || connectedSuccess}
              className="w-full flex items-stretch rounded-xl border-2 border-black dark:border-white/30 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#FFC800] overflow-hidden active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 group"
            >
              <div className="flex-1 bg-[#FFC800] group-hover:bg-[#FFD21A] py-3.5 text-center font-display font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 transition-colors">
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>CONNECTING RAIL...</span>
                  </>
                ) : connectedSuccess ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3} />
                    <span>CONNECTED! ENTERING...</span>
                  </>
                ) : (
                  <span>CONNECT &amp; ENTER PORTAL</span>
                )}
              </div>
              <div className="w-12 bg-black dark:bg-[#121214] flex items-center justify-center text-white dark:text-[#FFC800] group-hover:bg-neutral-800 dark:group-hover:bg-neutral-900 transition-colors">
                <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
