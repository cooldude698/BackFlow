import express from 'express';
import cors from 'cors';
import { agreementService } from './services/agreementService.js';
import { TestnetPaymentAdapter } from './adapters/TestnetPaymentAdapter.js';
import { blockchainListener } from './indexer/blockchainListener.js';
import { validateAgreementInput } from '@backflow/validation';
import { AgreementStatus } from '@backflow/types';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const paymentAdapter = new TestnetPaymentAdapter(
  process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  process.env.SETTLEMENT_ENGINE_ADDRESS || '0x54e27243573E9da2A962136e9A9555513499c508',
  process.env.PAYMENT_TOKEN_ADDRESS || '0xe378BDee81773a63F69f16012c1472A89e69898c'
);

// Helper for BigInt JSON serialization
const serialize = (data: any) =>
  JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );

app.get('/health', (req, res) => {
  res.json({ status: 'ok', protocol: 'BackFlow', network: 'Monad Testnet' });
});

// List agreements
app.get('/agreements', (req, res) => {
  const agreements = agreementService.getAllAgreements();
  res.json(serialize(agreements));
});

// Get agreement by ID
app.get('/agreements/:id', (req, res) => {
  const agreement = agreementService.getAgreement(req.params.id);
  if (!agreement) {
    return res.status(404).json({ error: 'Agreement not found' });
  }
  const backers = agreementService.getBackers(req.params.id);
  res.json(serialize({ ...agreement, backers }));
});

// Create new agreement
app.post('/agreements', (req, res) => {
  const {
    id,
    earnerAddress,
    earnerName,
    paymentToken,
    fundingTarget,
    revenueShareBps,
    capMultiplierBps,
    durationSeconds
  } = req.body;

  const target = BigInt(fundingTarget || 0);
  const revShare = BigInt(revenueShareBps || 1000);
  const capMultiplier = BigInt(capMultiplierBps || 20000);
  const durSecs = BigInt(durationSeconds || 31536000);

  const validation = validateAgreementInput({
    earnerAddress,
    fundingTarget: target,
    revenueShareBps: revShare,
    capMultiplierBps: capMultiplier,
    durationSeconds: durSecs
  });

  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const newAgreement = agreementService.createAgreement({
    id: id || `BF-${Date.now().toString().slice(-4)}`,
    earnerAddress,
    earnerName: earnerName || 'Earner',
    paymentToken: paymentToken || '0xUSDC',
    fundingTarget: target,
    totalFunded: 0n,
    revenueShareBps: revShare,
    capMultiplierBps: capMultiplier,
    totalMaximumReturn: (target * capMultiplier) / 10000n,
    totalDistributed: 0n,
    durationSeconds: durSecs,
    status: AgreementStatus.FUNDING,
    createdAt: new Date()
  });

  res.status(201).json(serialize(newAgreement));
});

// Simulate financial distribution preview
app.post('/agreements/:id/simulate-settlement', (req, res) => {
  try {
    const grossPayment = BigInt(req.body.grossPayment || 0);
    const result = agreementService.simulateSettlement(req.params.id, grossPayment);
    res.json(serialize(result));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start indexer on launch
blockchainListener.startWatching();

// List indexed settlements
app.get('/settlements', (req, res) => {
  const settlements = agreementService.getSettlements();
  res.json(serialize(settlements));
});

// Get settlements for a specific agreement
app.get('/agreements/:id/settlements', (req, res) => {
  const settlements = agreementService.getSettlements(req.params.id);
  res.json(serialize(settlements));
});

// Create payment session
app.post('/payments/create-intent', async (req, res) => {
  try {
    const { agreementId, amount, currency, payerAddress } = req.body;
    const session = await paymentAdapter.createPaymentSession({
      agreementId,
      payerAddress: payerAddress || '0xClient',
      amount: BigInt(amount),
      currency: currency || 'USDC'
    });
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger / record on-chain settlement
app.post('/payments/settle', async (req, res) => {
  try {
    const { agreementId, grossAmount, payerAddress } = req.body;
    const amount = BigInt(grossAmount);
    const payer = payerAddress || '0xClient';

    const execution = await paymentAdapter.executeSettlement(agreementId, amount, payer);

    // Process on-chain event idempotently
    blockchainListener.processLog({
      transactionHash: execution.transactionHash,
      logIndex: 0,
      agreementId,
      eventName: 'PaymentSettled',
      blockNumber: execution.blockNumber,
      args: {
        grossAmount: amount.toString(),
        earnerShare: execution.earnerShare.toString(),
        totalBackerShare: execution.backerShareTotal.toString(),
        payer
      }
    });

    res.json(serialize(execution));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// User profile state (in-memory persistent store)
export interface UserProfile {
  name: string;
  email?: string;
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

let currentUserProfile: UserProfile = {
  name: 'Aman',
  email: 'aman@example.com',
  phone: '+91 98765 43210',
  isVerified: true,
  payoutType: 'upi',
  payoutIdentifier: 'aman@upi',
  payoutDetails: {
    upiId: 'aman@upi'
  }
};

// Send OTP endpoint
app.post('/auth/send-otp', (req, res) => {
  const { phone, name, email } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  if (email) currentUserProfile.email = email;
  const mockOtp = '849201';
  res.json({
    success: true,
    message: `Verification code sent to ${phone}`,
    otp: mockOtp,
    phone,
    email: currentUserProfile.email
  });
});

// Verify OTP endpoint
app.post('/auth/verify-otp', (req, res) => {
  const { phone, otp, name, email } = req.body;
  if (!otp) {
    return res.status(400).json({ error: 'OTP is required' });
  }
  if (phone) currentUserProfile.phone = phone;
  if (name) currentUserProfile.name = name;
  if (email) currentUserProfile.email = email;
  currentUserProfile.isVerified = true;

  const agreement = agreementService.getAgreement('BF-001');
  if (agreement && name) {
    agreement.earnerName = name;
  }

  res.json({
    success: true,
    user: currentUserProfile
  });
});

// Get user profile
app.get('/user/profile', (req, res) => {
  res.json(currentUserProfile);
});

// Update / connect earner payout rail
app.post('/user/payout-method', (req, res) => {
  const { payoutType, payoutIdentifier, payoutDetails, name, email } = req.body;
  if (!payoutIdentifier) {
    return res.status(400).json({ error: 'Payout identifier (UPI ID or Card details) is required' });
  }
  currentUserProfile.payoutType = payoutType || 'upi';
  currentUserProfile.payoutIdentifier = payoutIdentifier;
  currentUserProfile.payoutDetails = payoutDetails || {};
  if (name) {
    currentUserProfile.name = name;
    const agreement = agreementService.getAgreement('BF-001');
    if (agreement) {
      agreement.earnerName = name;
    }
  }
  if (email) {
    currentUserProfile.email = email;
  }
  res.json({
    success: true,
    profile: currentUserProfile,
    message: `Auto-Split rail connected to ${payoutIdentifier}`
  });
});

// Gas-Sponsored Relayer Settlement Endpoint
app.post('/payments/relay', async (req, res) => {
  try {
    const { agreementId, grossAmount, payerAddress, paymentMethod, payerName } = req.body;
    if (!agreementId || !grossAmount) {
      return res.status(400).json({ error: 'Missing agreementId or grossAmount' });
    }

    const amount = BigInt(grossAmount);
    const payer = payerAddress || '0xClient';
    const method = paymentMethod || 'Monad USDC';

    const execution = await paymentAdapter.executeSettlement(agreementId, amount, payer);

    blockchainListener.processLog({
      transactionHash: execution.transactionHash,
      logIndex: 0,
      agreementId,
      eventName: 'PaymentSettled',
      blockNumber: execution.blockNumber,
      args: {
        grossAmount: amount.toString(),
        earnerShare: execution.earnerShare.toString(),
        totalBackerShare: execution.backerShareTotal.toString(),
        payer,
        paymentMethod: method,
        payerName: payerName || 'Client'
      }
    });

    res.json(
      serialize({
        ...execution,
        paymentMethod: method,
        payerName: payerName || 'Client',
        relaySponsored: true,
        relayerConfigured: paymentAdapter.hasRelayer()
      })
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🌊 BackFlow API server running at http://localhost:${port}`);
  });
}

export default app;
