import { agreementService } from '../services/agreementService.js';

export interface IndexedEvent {
  transactionHash: string;
  logIndex: number;
  agreementId: string;
  eventName: string;
  args: any;
}

export class BlockchainListener {
  private processedLogs = new Set<string>();

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
      const grossAmount = BigInt(event.args.grossAmount);
      agreementService.recordOnChainSettlement(event.agreementId, grossAmount);
    }

    return true;
  }
}

export const blockchainListener = new BlockchainListener();
