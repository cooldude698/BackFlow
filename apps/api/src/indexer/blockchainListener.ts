import { createPublicClient, http, type WatchContractEventReturnType, defineChain } from 'viem';
import { agreementService } from '../services/agreementService.js';
import { SettlementRecord } from '@backflow/types';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz']
    }
  }
});

export const SETTLEMENT_ENGINE_ABI = [
  {
    type: 'event',
    name: 'PaymentSettled',
    inputs: [
      { name: 'agreementId', type: 'uint256', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'grossAmount', type: 'uint256', indexed: false },
      { name: 'totalBackerShare', type: 'uint256', indexed: false },
      { name: 'earnerShare', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'BackerPaid',
    inputs: [
      { name: 'agreementId', type: 'uint256', indexed: true },
      { name: 'backer', type: 'address', indexed: true },
      { name: 'amountPaid', type: 'uint256', indexed: false },
      { name: 'totalDistributedToBacker', type: 'uint256', indexed: false },
      { name: 'capReached', type: 'bool', indexed: false }
    ]
  }
] as const;

export interface IndexedEvent {
  transactionHash: string;
  logIndex: number;
  agreementId: string;
  eventName: string;
  args: any;
  blockNumber?: number;
}

export class BlockchainListener {
  private processedLogs = new Set<string>();
  private unwatchSubscription: WatchContractEventReturnType | null = null;
  private isListening = false;

  /**
   * Idempotently process an on-chain event.
   * Key: transaction_hash + ':' + log_index
   */
  processLog(event: IndexedEvent): boolean {
    const idempotencyKey = `${event.transactionHash}:${event.logIndex}`;
    if (this.processedLogs.has(idempotencyKey)) {
      console.warn(`[Indexer] Duplicate event detected. Skipping ${idempotencyKey}`);
      return false;
    }

    this.processedLogs.add(idempotencyKey);
    console.log(`[Indexer] Processed on-chain event: ${event.eventName} for Agreement ${event.agreementId}`);

    if (event.eventName === 'PaymentSettled') {
      const grossAmount = BigInt(event.args.grossAmount || 0);
      const earnerShare = BigInt(event.args.earnerShare || 0);
      const totalBackerShare = BigInt(event.args.totalBackerShare || 0);

      // Resolve agreement by string ID or chainAgreementId
      const targetAgreementId = this.resolveAgreementId(event.agreementId);

      // 1. Record in-memory / database accounting
      try {
        agreementService.recordOnChainSettlement(targetAgreementId, grossAmount);
      } catch (err: any) {
        console.warn(`[Indexer] Agreement settlement update skipped: ${err.message}`);
      }

      // 2. Insert into settlements table with strict idempotency constraint
      const settlementRecord: SettlementRecord = {
        id: `stl_${Date.now()}_${event.logIndex}`,
        agreementId: targetAgreementId,
        paymentId: `pay_${event.transactionHash.slice(0, 10)}`,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber || 0,
        logIndex: event.logIndex,
        grossAmount,
        earnerAmount: earnerShare > 0n ? earnerShare : (grossAmount * 9000n) / 10000n,
        totalBackerAmount: totalBackerShare > 0n ? totalBackerShare : (grossAmount * 1000n) / 10000n,
        createdAt: new Date()
      };

      agreementService.recordSettlementLog(settlementRecord);
    }

    return true;
  }

  /**
   * Resolve an on-chain agreementId (e.g. 1) to the BackFlow agreement identifier (e.g. BF-001)
   */
  private resolveAgreementId(rawId: string | bigint | number): string {
    const rawStr = String(rawId);
    const all = agreementService.getAllAgreements();
    const match = all.find((ag) => ag.id === rawStr || ag.chainAgreementId?.toString() === rawStr);
    return match ? match.id : rawStr;
  }

  /**
   * Connect real-time Viem watchContractEvent listener to Monad RPC.
   */
  startWatching(
    engineAddress?: string,
    rpcUrl?: string
  ): boolean {
    const address = (engineAddress || process.env.SETTLEMENT_ENGINE_ADDRESS) as `0x${string}`;
    const rpc = rpcUrl || process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';

    if (!address || address === '0xSettlementEngineMock' || !address.startsWith('0x') || address.length !== 42) {
      console.log(`[Indexer] No live contract address configured (${address}). Indexer ready for direct log ingestion.`);
      return false;
    }

    try {
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(rpc)
      });

      console.log(`[Indexer] Connecting Viem contract watcher to Monad RPC: ${rpc} (Target: ${address})`);

      this.unwatchSubscription = publicClient.watchContractEvent({
        address,
        abi: SETTLEMENT_ENGINE_ABI,
        eventName: 'PaymentSettled',
        onLogs: (logs) => {
          for (const log of logs) {
            const { agreementId, payer, grossAmount, totalBackerShare, earnerShare } = (log as any).args || {};
            this.processLog({
              transactionHash: log.transactionHash,
              logIndex: Number(log.logIndex),
              agreementId: String(agreementId),
              eventName: 'PaymentSettled',
              args: {
                grossAmount: grossAmount?.toString() || '0',
                earnerShare: earnerShare?.toString() || '0',
                totalBackerShare: totalBackerShare?.toString() || '0',
                payer
              },
              blockNumber: Number(log.blockNumber || 0)
            });
          }
        },
        onError: (error) => {
          console.error('[Indexer] Error on Monad event stream:', error.message);
        }
      });

      this.isListening = true;
      console.log('⚡ [Indexer] Real-time Viem event consumer ACTIVE on Monad testnet!');
      return true;
    } catch (err: any) {
      console.warn(`[Indexer] Unable to initialize Viem listener: ${err.message}`);
      return false;
    }
  }

  stopWatching(): void {
    if (this.unwatchSubscription) {
      this.unwatchSubscription();
      this.unwatchSubscription = null;
      this.isListening = false;
      console.log('[Indexer] Stopped contract event watcher');
    }
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export const blockchainListener = new BlockchainListener();
