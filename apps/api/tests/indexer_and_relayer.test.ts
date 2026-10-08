import test from 'node:test';
import assert from 'node:assert/strict';
import { BlockchainListener } from '../src/indexer/blockchainListener.js';
import { TestnetPaymentAdapter } from '../src/adapters/TestnetPaymentAdapter.js';
import { agreementService } from '../src/services/agreementService.js';

test('BlockchainListener: Idempotent Event Processing', () => {
  const listener = new BlockchainListener();
  const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const logIndex = 2;

  const eventPayload = {
    transactionHash: txHash,
    logIndex,
    agreementId: 'BF-001',
    eventName: 'PaymentSettled',
    blockNumber: 105020,
    args: {
      grossAmount: '1000000000', // $1,000 USDC
      earnerShare: '900000000',
      totalBackerShare: '100000000',
      payer: '0x3001'
    }
  };

  // First ingestion should succeed
  const firstResult = listener.processLog(eventPayload);
  assert.equal(firstResult, true, 'First event ingestion must succeed');

  // Second ingestion of same event must be ignored (idempotent)
  const duplicateResult = listener.processLog(eventPayload);
  assert.equal(duplicateResult, false, 'Duplicate event must be ignored silently');

  // Verify settlement record was created in store
  const settlements = agreementService.getSettlements('BF-001');
  const matched = settlements.find((s) => s.transactionHash === txHash && s.logIndex === logIndex);
  assert.ok(matched, 'Settlement record must exist in settlements table');
  assert.equal(matched.grossAmount, 1000000000n);
  assert.equal(matched.earnerAmount, 900000000n);
  assert.equal(matched.totalBackerAmount, 100000000n);
});

test('TestnetPaymentAdapter: Local Simulation & Relayer Fallback', async () => {
  const adapter = new TestnetPaymentAdapter(
    'https://testnet-rpc.monad.xyz',
    '0xMockSettlementEngine',
    '0xMockUSDC'
  );

  assert.equal(adapter.hasRelayer(), false, 'Relayer should not be marked active without private key');

  // Session intent creation
  const session = await adapter.createPaymentSession({
    agreementId: 'BF-001',
    amount: 1000000000n,
    currency: 'USDC',
    payerAddress: '0x3001'
  });
  assert.ok(session.sessionId.startsWith('session_'));
  assert.ok(session.checkoutUrl.includes('/pay/BF-001'));

  // Settlement execution in simulation fallback mode
  const execution = await adapter.executeSettlement('BF-001', 1000000000n, '0x3001');
  assert.ok(execution.transactionHash.startsWith('0x'));
  assert.equal(execution.grossAmount, 1000000000n);
  assert.equal(execution.backerShareTotal, 100000000n);
  assert.equal(execution.earnerShare, 900000000n);
  assert.equal(execution.sponsoredByRelayer, false);
});
