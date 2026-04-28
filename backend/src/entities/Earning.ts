import { randomUUID } from "node:crypto";

export interface EarningProps {
  id: string;
  therapistId: string;
  sessionId: string;
  amount: number;
  platformCommission: number;
  netAmount: number;
  isPaid: boolean;
  paidAt: Date | null;
  withdrawalId: string | null;
  createdAt: Date;
}

export interface CreateEarningInput {
  therapistId: string;
  sessionId: string;
  amount: number;
  commissionRate: number; // e.g. 0.10 for 10%
}

export interface EarningResponse {
  id: string;
  therapistId: string;
  sessionId: string;
  amount: number;
  platformCommission: number;
  netAmount: number;
  isPaid: boolean;
  paidAt: Date | null;
  withdrawalId: string | null;
  createdAt: Date;
}

export class Earning {
  public readonly id: string;
  public readonly therapistId: string;
  public readonly sessionId: string;
  public readonly amount: number;
  public readonly platformCommission: number;
  public readonly netAmount: number;
  public isPaid: boolean;
  public paidAt: Date | null;
  public withdrawalId: string | null;
  public readonly createdAt: Date;

  constructor(props: EarningProps) {
    this.id = props.id;
    this.therapistId = props.therapistId;
    this.sessionId = props.sessionId;
    this.amount = props.amount;
    this.platformCommission = props.platformCommission;
    this.netAmount = props.netAmount;
    this.isPaid = props.isPaid;
    this.paidAt = props.paidAt;
    this.withdrawalId = props.withdrawalId;
    this.createdAt = props.createdAt;
  }

  public static create(input: CreateEarningInput): Earning {
    const commission = Math.round(input.amount * input.commissionRate * 100) / 100;
    const net = Math.round((input.amount - commission) * 100) / 100;

    return new Earning({
      id: randomUUID(),
      therapistId: input.therapistId,
      sessionId: input.sessionId,
      amount: input.amount,
      platformCommission: commission,
      netAmount: net,
      isPaid: false,
      paidAt: null,
      withdrawalId: null,
      createdAt: new Date(),
    });
  }

  public static fromPersistence(record: any): Earning {
    return new Earning({
      id: record.id,
      therapistId: record.therapistId,
      sessionId: record.sessionId,
      amount: record.amount,
      platformCommission: record.platformCommission,
      netAmount: record.netAmount,
      isPaid: record.isPaid,
      paidAt: record.paidAt ?? null,
      withdrawalId: record.withdrawalId ?? null,
      createdAt: record.createdAt,
    });
  }

  public markPaid(withdrawalId: string): void {
    this.isPaid = true;
    this.paidAt = new Date();
    this.withdrawalId = withdrawalId;
  }

  public isOwnedByTherapist(therapistId: string): boolean {
    return this.therapistId === therapistId;
  }

  public toResponse(): EarningResponse {
    return {
      id: this.id,
      therapistId: this.therapistId,
      sessionId: this.sessionId,
      amount: this.amount,
      platformCommission: this.platformCommission,
      netAmount: this.netAmount,
      isPaid: this.isPaid,
      paidAt: this.paidAt,
      withdrawalId: this.withdrawalId,
      createdAt: this.createdAt,
    };
  }
}
