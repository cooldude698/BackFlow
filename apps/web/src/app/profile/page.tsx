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
        name: profile?.name || 'Aman'
      });

      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('backflow_user');
        const parsed = existing ? JSON.parse(existing) : {};
        const updated = {
          ...parsed,
          payoutType,
          payoutIdentifier: identifier
        };
        localStorage.setItem('backflow_user', JSON.stringify(updated));
        setProfile(updated as any);
      }

      setSaveSuccess(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFC800', '#000000', '#FFFFFF']
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
  const userEmail = profile?.email || 'aman@example.com';
  const userPhone = profile?.phone || '+91 98765 43210';
  const railId = profile?.payoutIdentifier || 'aman@upi';
  const railType = profile?.payoutType || 'upi';

  return (
    <div className="space-y-3.5 pb-4">
      {/* 1. Profile Header Card */}
      <div className="app-card-highlight p-5 space-y-3 relative overflow-hidden">
        <div className="absolute top-3 right-3 w-8 h-8 dot-grid opacity-60 pointer-events-none" />

        <div className="flex items-center gap-3.5">
          <div className="h-16 w-16 rounded-2xl bg-[#FFC800] border-[2.5px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center text-black font-display font-black text-2xl flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-black uppercase text-black tracking-tight truncate">
                {userName}
              </h1>
              <span className="badge-emerald text-[9px]">
                <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
                VERIFIED
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-black/70 mt-0.5">{userPhone}</div>
            <div className="label-caps mt-1 flex items-center gap-1.5" style={{ fontSize: '9px' }}>
              <span>BF-001</span>
              <span>•</span>
              <span>MONAD TESTNET</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Login Details Summary */}
      <div className="app-card p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="label-caps flex items-center gap-1.5" style={{ fontSize: '9.5px' }}>
            <User className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
            <span>LOGIN INFORMATION</span>
          </div>
          <span className="badge-periwinkle text-[8.5px]">
            OTP AUTHENTICATED
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-1 border-b border-black/10">
            <span className="font-bold text-black/70">Full Name</span>
            <span className="font-display font-black text-black">{userName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-black/10">
            <span className="font-bold text-black/70">Email Address</span>
            <span className="font-mono font-bold text-black">{userEmail}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-black/10">
            <span className="font-bold text-black/70">Registered Phone</span>
            <span className="font-mono font-bold text-black">{userPhone}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="font-bold text-black/70">Security Rail</span>
            <span className="text-black flex items-center gap-1 font-mono font-bold text-[11px]">
              <Lock className="h-3 w-3 text-emerald-700" strokeWidth={2.5} />
              6-Digit SMS Verification
            </span>
          </div>
        </div>
      </div>

      {/* 3. Connected Automatic Payout Rail Card */}
      <div className="app-card p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="label-caps flex items-center gap-1.5" style={{ fontSize: '9.5px' }}>
            {railType === 'card' ? (
              <CreditCard className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
            ) : railType === 'bank' ? (
              <Building className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
            ) : (
              <QrCode className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
            )}
            <span>AUTOMATIC PAYOUT RAIL</span>
          </div>

          {!editingRail && (
            <button
              onClick={() => setEditingRail(true)}
              className="text-[10px] font-display font-black uppercase text-black bg-white hover:bg-[#FFC800] border-1.5 border-black shadow-[1.5px_1.5px_0px_#000] px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
            >
              <Edit3 className="h-3 w-3" strokeWidth={2.5} />
              Edit Rail
            </button>
          )}
        </div>

        {!editingRail ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-black/70">Payout Method</span>
              <span className="badge-periwinkle text-[9px] uppercase">
                {railType}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-black/70">Linked Destination</span>
              <span className="font-mono font-black text-black text-xs">
                {railId}
              </span>
            </div>

            <div className="inset-card p-3 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-black font-display font-black uppercase text-[10px]">
                <Zap className="h-3.5 w-3.5 text-[#FFC800]" fill="#FFC800" stroke="#000" />
                <span>90% Net Deposit Guarantee</span>
              </div>
              <p className="text-black/80 font-medium leading-relaxed text-[10.5px]">
                All client inflows automatically split: 90% immediately deposits to this rail, 10% auto-repays your syndicate backers.
              </p>
            </div>
          </div>
        ) : (
          /* Edit Payout Form */
          <form onSubmit={handleUpdateRail} className="space-y-3 pt-1 animate-fade-in">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#FAF9F5] border-2 border-black text-xs">
              <button
                type="button"
                onClick={() => setPayoutType('upi')}
                className={`py-1.5 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'upi'
                    ? 'bg-[#FFC800] text-black border-1.5 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 hover:text-black'
                }`}
              >
                <QrCode className="h-3 w-3" strokeWidth={2.5} />
                UPI
              </button>
              <button
                type="button"
                onClick={() => setPayoutType('card')}
                className={`py-1.5 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'card'
                    ? 'bg-[#FFC800] text-black border-1.5 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 hover:text-black'
                }`}
              >
                <CreditCard className="h-3 w-3" strokeWidth={2.5} />
                Card
              </button>
              <button
                type="button"
                onClick={() => setPayoutType('bank')}
                className={`py-1.5 rounded-lg font-display font-black text-[11px] uppercase flex items-center justify-center gap-1 transition-all ${
                  payoutType === 'bank'
                    ? 'bg-[#FFC800] text-black border-1.5 border-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'text-black/70 hover:text-black'
                }`}
              >
                <Building className="h-3 w-3" strokeWidth={2.5} />
                Bank
              </button>
            </div>

            {payoutType === 'upi' && (
              <div>
                <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>NEW UPI ID</span>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@upi"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border-2 border-black text-black font-mono font-bold text-xs focus:outline-none"
                />
              </div>
            )}

            {payoutType === 'card' && (
              <div>
                <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>CARD NUMBER</span>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 8912 3456 8821"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border-2 border-black text-black font-mono font-bold text-xs focus:outline-none"
                />
              </div>
            )}

            {payoutType === 'bank' && (
              <div className="space-y-2">
                <div>
                  <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>ACCOUNT NUMBER</span>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. 50100234891023"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border-2 border-black text-black font-mono font-bold text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <span className="label-caps block mb-1" style={{ fontSize: '9px' }}>IFSC / SWIFT</span>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF9F5] border-2 border-black text-black font-mono font-bold text-xs focus:outline-none uppercase"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-100 border-2 border-black text-xs text-red-900 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingRail(false)}
                className="flex-1 py-2 rounded-xl bg-white border-2 border-black text-black font-display font-black text-xs hover:bg-[#FAF9F5]"
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
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
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
      <div className="app-card p-4 space-y-2 text-xs">
        <div className="label-caps pb-1 border-b-2 border-black" style={{ fontSize: '9.5px' }}>
          PROTOCOL TERMS
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div className="inset-card p-2">
            <div className="text-[9.5px] font-bold text-black/60">You Keep</div>
            <div className="text-base font-black text-black mt-0.5">90%</div>
          </div>
          <div className="inset-card p-2">
            <div className="text-[9.5px] font-bold text-black/60">Backers Cut</div>
            <div className="text-base font-black text-red-600 mt-0.5">10%</div>
          </div>
          <div className="inset-card p-2">
            <div className="text-[9.5px] font-bold text-black/60">Max Cap</div>
            <div className="text-base font-black text-black mt-0.5">2.0×</div>
          </div>
        </div>
      </div>

      {/* 5. Sign Out Action Button */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-xl bg-white hover:bg-red-50 border-2 border-black shadow-[3px_3px_0px_#000] text-red-600 font-display font-black uppercase text-xs flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.5} />
          <span>SIGN OUT OF PORTAL</span>
        </button>
      </div>
    </div>
  );
}
