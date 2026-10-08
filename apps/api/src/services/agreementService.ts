import { calculateSettlement, calculateCap } from '@backflow/financial-engine';
import { Agreement, AgreementStatus, BackerPosition } from '@backflow/types';

// In-memory persistent store (mirrors PostgreSQL database)
class AgreementStore {
  private agreements = new Map<string, Agreement>();
  private backers = new Map<string, BackerPosition[]>();

  constructor() {
    this.seedDemoRahul();
  }

  // Pre-seed canonical Rahul milestone agreement for instant hackathon demo!
  private seedDemoRahul() {
    const rahulAgreementId = 'BF-001';
    const fundingTarget = 2000n * 1000000n; // $2,000 USDC (6 decimals)
    const capMultiplierBps = 20000n; // 2.0x

    const demoAgreement: Agreement = {
      id: rahulAgreementId,
      chainAgreementId: 1n,
      earnerAddress: '0x1001000000000000000000000000000000001001',
      earnerName: 'Rahul (Full-Stack Freelancer)',
      paymentToken: '0xUSDC000000000000000000000000000000000000',
      fundingTarget,
      totalFunded: fundingTarget,
      revenueShareBps: 1000n, // 10.00%
      capMultiplierBps,
      totalMaximumReturn: 4000n * 1000000n, // $4,000 USDC
      totalDistributed: 0n,
      durationSeconds: 365n * 86400n,
      status: AgreementStatus.ACTIVE,
      createdAt: new Date()
    };

    const demoBackers: BackerPosition[] = [
      {
        id: 'pos_a',
        agreementId: rahulAgreementId,
        backerAddress: '0x2001000000000000000000000000000000002001',
        backerName: 'Aman (Backer A - 20%)',
        fundedAmount: 400n * 1000000n,
        distributedAmount: 0n,
        maxCap: calculateCap(400n * 1000000n, capMultiplierBps), // $800
        isCompleted: false,
        createdAt: new Date()
      },
      {
        id: 'pos_b',
        agreementId: rahulAgreementId,
        backerAddress: '0x2002000000000000000000000000000000002002',
        backerName: 'Priya (Backer B - 30%)',
        fundedAmount: 600n * 1000000n,
        distributedAmount: 0n,
        maxCap: calculateCap(600n * 1000000n, capMultiplierBps), // $1,200
        isCompleted: false,
        createdAt: new Date()
      },
      {
        id: 'pos_c',
        agreementId: rahulAgreementId,
        backerAddress: '0x2003000000000000000000000000000000002003',
        backerName: 'Karan (Backer C - 50%)',
        fundedAmount: 1000n * 1000000n,
        distributedAmount: 0n,
        maxCap: calculateCap(1000n * 1000000n, capMultiplierBps), // $2,000
        isCompleted: false,
        createdAt: new Date()
      }
    ];

    this.agreements.set(rahulAgreementId, demoAgreement);
    this.backers.set(rahulAgreementId, demoBackers);
  }

  getAgreement(id: string): Agreement | undefined {
    return this.agreements.get(id);
  }

  getAllAgreements(): Agreement[] {
    return Array.from(this.agreements.values());
  }

  getBackers(agreementId: string): BackerPosition[] {
    return this.backers.get(agreementId) || [];
  }

  createAgreement(agreement: Agreement): Agreement {
    this.agreements.set(agreement.id, agreement);
    this.backers.set(agreement.id, []);
    return agreement;
  }

  addBacker(position: BackerPosition): BackerPosition {
    const list = this.backers.get(position.agreementId) || [];
    list.push(position);
    this.backers.set(position.agreementId, list);
    return position;
  }

  simulateSettlement(agreementId: string, grossPayment: bigint) {
    const agreement = this.getAgreement(agreementId);
    if (!agreement) throw new Error('Agreement not found');

    const backers = this.getBackers(agreementId);

    return calculateSettlement({
      grossPayment,
      revenueShareBps: agreement.revenueShareBps,
      totalFunded: agreement.totalFunded,
      backers: backers.map((b) => ({
        backerAddress: b.backerAddress,
        fundedAmount: b.fundedAmount,
        distributedAmount: b.distributedAmount,
        maxCap: b.maxCap
      }))
    });
  }

  recordOnChainSettlement(agreementId: string, grossPayment: bigint) {
    const agreement = this.getAgreement(agreementId);
    if (!agreement) throw new Error('Agreement not found');

    const calculation = this.simulateSettlement(agreementId, grossPayment);
    const backers = this.getBackers(agreementId);

    for (const alloc of calculation.backerAllocations) {
      const b = backers.find((x) => x.backerAddress === alloc.backerAddress);
      if (b) {
        b.distributedAmount = alloc.newDistributed;
        b.isCompleted = alloc.capReached;
      }
    }

    agreement.totalDistributed += calculation.actualTotalBackerPayout;
    if (calculation.allBackersCompleted) {
      agreement.status = AgreementStatus.COMPLETED;
    }

    return calculation;
  }
}

export const agreementService = new AgreementStore();
