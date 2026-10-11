const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface BackerPositionDTO {
  id: string;
  agreementId: string;
  backerAddress: string;
  backerName: string;
  fundedAmount: string; // 6 decimals (micro-USDC)
  distributedAmount: string;
  maxCap: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface AgreementDTO {
  id: string;
  chainAgreementId?: string;
  earnerAddress: string;
  earnerName: string;
  paymentToken: string;
  fundingTarget: string; // 6 decimals
  totalFunded: string;
  revenueShareBps: string; // 1000 = 10%
  capMultiplierBps: string; // 20000 = 2.0x
  totalMaximumReturn: string;
  totalDistributed: string;
  durationSeconds: string;
  status: string;
  createdAt: string;
  backers: BackerPositionDTO[];
}

export interface SettlementRecordDTO {
  id: string;
  agreementId: string;
  paymentId: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
  grossAmount: string; // 6 decimals
  earnerAmount: string;
  totalBackerAmount: string;
  paymentMethod?: string;
  payerName?: string;
  createdAt: string;
}

export interface RecipientDistributionDTO {
  recipient: string;
  amount: string;
  type: 'EARNER' | 'BACKER';
}

export interface SettlementExecutionDTO {
  transactionHash: string;
  blockNumber: number;
  grossAmount: string;
  backerShareTotal: string;
  earnerShare: string;
  recipientDistributions: RecipientDistributionDTO[];
  sponsoredByRelayer: boolean;
  relaySponsored?: boolean;
  relayerConfigured?: boolean;
  paymentMethod?: string;
  payerName?: string;
}

export interface SettlementSimulationDTO {
  grossPayment: string;
  theoreticalBackerPool: string;
  actualTotalBackerPayout: string;
  earnerPayout: string;
  backerAllocations: Array<{
    backerAddress: string;
    allocatedAmount: string;
    previousDistributed: string;
    newDistributed: string;
    maxCap: string;
    capReached: boolean;
  }>;
  allBackersCompleted: boolean;
}

export interface UserProfileDTO {
  name: string;
  phone: string;
  isVerified: boolean;
  payoutType: 'upi' | 'card' | 'bank' | 'web3';
  payoutIdentifier: string;
  payoutDetails?: {
    upiId?: string;
    cardNumberMasked?: string;
    cardHolderName?: string;
    cardExpiry?: string;
    bankAccountNumber?: string;
    ifscOrRouting?: string;
    walletAddress?: string;
  };
}

export function microToDollars(micro: string | number | bigint | undefined): number {
  if (!micro) return 0;
  return Number(micro) / 1_000_000;
}

export function formatUSD(micro: string | number | bigint | undefined, decimals = 2): string {
  const amount = microToDollars(micro);
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function dollarsToMicro(dollars: number): string {
  return Math.round(dollars * 1_000_000).toString();
}

/**
 * Fetch agreement and associated backer syndicate positions
 */
export async function getAgreement(id: string): Promise<AgreementDTO> {
  const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch agreement ${id}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch indexed settlement transaction records
 */
export async function getSettlements(agreementId?: string): Promise<SettlementRecordDTO[]> {
  const url = agreementId
    ? `${API_BASE_URL}/agreements/${agreementId}/settlements`
    : `${API_BASE_URL}/settlements`;

  const res = await fetch(url, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch settlements: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Preview settlement distributions without committing to state
 */
export async function simulateSettlement(
  agreementId: string,
  grossAmountMicro: string
): Promise<SettlementSimulationDTO> {
  const res = await fetch(`${API_BASE_URL}/agreements/${agreementId}/simulate-settlement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grossPayment: grossAmountMicro })
  });
  if (!res.ok) {
    throw new Error(`Simulation failed: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Trigger gas-sponsored atomic settlement via BackFlow relayer with payment method
 */
export async function relayPayment(
  agreementId: string,
  grossAmountMicro: string,
  payerAddress = '0xClientPayer999900000000000000000000000001',
  paymentMethod = 'Monad USDC',
  payerName = 'Client'
): Promise<SettlementExecutionDTO> {
  const res = await fetch(`${API_BASE_URL}/payments/relay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agreementId,
      grossAmount: grossAmountMicro,
      payerAddress,
      paymentMethod,
      payerName
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Payment relay failed: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Send OTP to phone number
 */
export async function sendOtp(phone: string, name?: string): Promise<{ success: boolean; message: string; otp: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, name })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send OTP');
  }
  return res.json();
}

/**
 * Verify phone OTP
 */
export async function verifyOtp(phone: string, otp: string, name?: string): Promise<{ success: boolean; user: UserProfileDTO }> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, name })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Invalid OTP');
  }
  return res.json();
}

/**
 * Get current earner profile
 */
export async function getUserProfile(): Promise<UserProfileDTO> {
  const res = await fetch(`${API_BASE_URL}/user/profile`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return res.json();
}

/**
 * Connect earner payout rail (UPI ID, Debit/Credit Card, Bank)
 */
export async function updatePayoutMethod(data: {
  payoutType: string;
  payoutIdentifier: string;
  payoutDetails?: any;
  name?: string;
}): Promise<{ success: boolean; profile: UserProfileDTO; message: string }> {
  const res = await fetch(`${API_BASE_URL}/user/payout-method`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update payout method');
  }
  return res.json();
}
