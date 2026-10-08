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
  process.env.SETTLEMENT_ENGINE_ADDRESS || '0xSettlementEngineMock',
  process.env.PAYMENT_TOKEN_ADDRESS || '0xMockUSDC'
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
  const capMult = BigInt(capMultiplierBps || 20000);
  const durSecs = BigInt(durationSeconds || 31536000);

  const validation = validateAgreementInput({
    earnerAddress,
    fundingTarget: target,
    revenueShareBps: revShare,
    capMultiplierBps: capMult,
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
    capMultiplierBps: capMult,
    totalMaximumReturn: (target * capMult) / 10000n,
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

    // Simulate blockchain event reception
    blockchainListener.processLog({
      transactionHash: execution.transactionHash,
      logIndex: 0,
      agreementId,
      eventName: 'PaymentSettled',
      args: {
        grossAmount: amount.toString(),
        payer
      }
    });

    res.json(serialize(execution));
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
