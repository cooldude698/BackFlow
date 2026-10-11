'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building,
  LogOut,
  Edit3,
  CheckCircle2,
  Zap,
  Check,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getUserProfile, updatePayoutMethod, UserProfileDTO } from '@/lib/api';

export default function UserProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [editingRail, setEditingRail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Rail states
  const [payoutType, setPayoutType] = useState<'upi' | 'card' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  useEffect(() => {
    // If not authenticated, redirect to login page
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('backflow_user');
      if (!stored) {
        router.push('/login');
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
        if (parsed.payoutType) setPayoutType(parsed.payoutType);
        if (parsed.payoutIdentifier) {
          if (parsed.payoutType === 'upi') setUpiId(parsed.payoutIdentifier);
          if (parsed.payoutType === 'card') setCardNumber(parsed.payoutIdentifier);
        }
      } catch {}
    }

    getUserProfile()
      .then((p) => {
        if (p) {
          setProfile((prev) => ({
            ...prev,
            ...p,
            isVerified: true
          }));
          if (p.payoutType === 'card' || p.payoutType === 'upi' || p.payoutType === 'bank') {
            setPayoutType(p.payoutType);
          }
          if (p.payoutIdentifier) {
            if (p.payoutType === 'upi') setUpiId(p.payoutIdentifier);
            if (p.payoutType === 'card') setCardNumber(p.payoutIdentifier);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleUpdateRail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
          cardHolderName: cardHolder || profile?.name || 'Aman',
          cardExpiry: cardExpiry || '08/28'
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
        name: profile?.name || 'Aman'
      });

      // Update localStorage
      if (typeof window !== 'undefined') {
        const updated = {
          name: profile?.name || 'Aman',
          phone: profile?.phone || '+91 98765 43210',
          payoutType,
          payoutIdentifier: identifier,
          isVerified: true
        };
        localStorage.setItem('backflow_user', JSON.stringify(updated));
        setProfile(updated as any);
      }

      setSaveSuccess(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#8B9DF8', '#A5B4FC', '#FF6B6B']
      });

      setTimeout(() => {
        setSaveSuccess(false);
        setEditingRail(false);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update payout rail');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('backflow_user');
    }
    router.push('/login');
  };

  const userName = profile?.name || 'Aman';
  const userPhone = profile?.phone || '+91 98765 43210';
  const railId = profile?.payoutIdentifier || 'aman@upi';
  const railType = profile?.payoutType || 'upi';

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* 1. Profile Header Card */}
      <div className="app-card-highlight p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-periwinkle to-indigo-500 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-periwinkle/20">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white truncate">{userName}</h1>
              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{userPhone}</div>
            <div className="text-[11px] text-periwinkle font-semibold mt-1 flex items-center gap-1">
              <span>BackFlow Verified Earner</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-slate-400">ID: BF-001</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Login Details Summary (What was filled during login) */}
      <div className="app-card p-4 space-y-3 bg-black/60 border border-white/10 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-periwinkle" />
            <span>Login Information</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
            OTP Authenticated
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Full Name</span>
            <span className="font-bold text-white">{userName}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Registered Phone</span>
            <span className="font-mono font-semibold text-white">{userPhone}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Security Rail</span>
            <span className="text-slate-300 flex items-center gap-1 font-mono text-[11px]">
              <Lock className="h-3 w-3 text-emerald-400" />
              6-Digit SMS Verification
            </span>
          </div>
        </div>
      </div>

      {/* 3. Connected Automatic Payout Rail Card */}
      <div className="app-card p-4 space-y-3 bg-black/60 border border-white/10 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            {railType === 'card' ? (
              <CreditCard className="h-3.5 w-3.5 text-periwinkle" />
            ) : railType === 'bank' ? (
              <Building className="h-3.5 w-3.5 text-periwinkle" />
            ) : (
              <QrCode className="h-3.5 w-3.5 text-periwinkle" />
            )}
            <span>Automatic Payout Rail</span>
          </div>

          {!editingRail && (
            <button
              onClick={() => setEditingRail(true)}
              className="text-[11px] font-bold text-periwinkle hover:text-white px-2 py-0.5 rounded-lg bg-periwinkle/10 border border-periwinkle/20 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="h-3 w-3" />
              Edit Rail
            </button>
          )}
        </div>

        {!editingRail ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Payout Method</span>
              <span className="uppercase font-mono font-bold text-periwinkle bg-periwinkle/10 px-2 py-0.5 rounded border border-periwinkle/20 text-[11px]">
                {railType}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Linked Destination</span>
              <span className="font-mono font-extrabold text-white text-xs tracking-wide">
                {railId}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black border border-white/5 space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-periwinkle font-bold">
                <Zap className="h-3.5 w-3.5" />
                <span>90% Net Deposit Guarantee</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[10px]">
                All client inflows on BackFlow automatically split: 90% immediately hits this payout rail, 10% repays your backers.
              </p>
            </div>
          </div>
        ) : (
          /* Edit Payout Form */
          <form onSubmit={handleUpdateRail} className="space-y-3 pt-1 animate-fade-in">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setPayoutType('upi')}
                className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'upi'
                    ? 'bg-periwinkle text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="h-3 w-3" />
                UPI
              </button>
              <button
                type="button"
                onClick={() => setPayoutType('card')}
                className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'card'
                    ? 'bg-periwinkle text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="h-3 w-3" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setPayoutType('bank')}
                className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'bank'
                    ? 'bg-periwinkle text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="h-3 w-3" />
                Bank
              </button>
            </div>

            {payoutType === 'upi' && (
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">
                  New UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@upi"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                />
              </div>
            )}

            {payoutType === 'card' && (
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">
                  Card Number (Visa / Mastercard)
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 8912 3456 8821"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                />
              </div>
            )}

            {payoutType === 'bank' && (
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 50100234891023"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">
                    IFSC / Swift
                  </label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-periwinkle"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-coral/15 border border-coral/30 text-xs text-coral flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingRail(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || saveSuccess}
                className="flex-1 py-2 rounded-xl btn-periwinkle font-black text-xs flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : saveSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Rail</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. Active Revenue Share Parameters */}
      <div className="app-card p-4 space-y-2 bg-black/60 border border-white/10 text-xs">
        <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider pb-1 border-b border-white/5">
          Protocol Terms
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div className="p-2 rounded-xl bg-black/80 border border-white/5">
            <div className="text-[10px] text-slate-400">You Keep</div>
            <div className="text-sm font-extrabold text-periwinkle mt-0.5">90%</div>
          </div>
          <div className="p-2 rounded-xl bg-black/80 border border-white/5">
            <div className="text-[10px] text-slate-400">Backers Cut</div>
            <div className="text-sm font-extrabold text-coral mt-0.5">10%</div>
          </div>
          <div className="p-2 rounded-xl bg-black/80 border border-white/5">
            <div className="text-[10px] text-slate-400">Max Cap</div>
            <div className="text-sm font-extrabold text-white mt-0.5">2.0×</div>
          </div>
        </div>
      </div>

      {/* 5. Sign Out Action Button */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-coral/15 border border-white/10 hover:border-coral/30 text-slate-300 hover:text-coral font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Portal</span>
        </button>
      </div>
    </div>
  );
}
