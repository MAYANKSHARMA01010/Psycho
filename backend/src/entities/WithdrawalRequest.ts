import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError";

export type WithdrawalStatusType = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface WithdrawalRequestProps {
  id: string;
  therapistId: string;
  amount: number;
  status: WithdrawalStatusType;
  notes: string | null;
  processedAt: Date | null;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWithdrawalInput {
  therapistId: string;
  amount: number;
}

export interface WithdrawalResponse {
  id: string;
  therapistId: string;
  amount: number;
  status: WithdrawalStatusType;
  notes: string | null;
  processedAt: Date | null;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class WithdrawalRequest {
  public readonly id: string;
  public readonly therapistId: string;
  public readonly amount: number;
  public status: WithdrawalStatusType;
  public notes: string | null;
  public processedAt: Date | null;
  public readonly requestedAt: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: WithdrawalRequestProps) {
    this.id = props.id;
    this.therapistId = props.therapistId;
    this.amount = props.amount;
    this.status = props.status;
    this.notes = props.notes;
    this.processedAt = props.processedAt;
    this.requestedAt = props.requestedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(input: CreateWithdrawalInput): WithdrawalRequest {
    if (input.amount <= 0) {
      throw ApiError.badRequest("Withdrawal amount must be greater than zero");
    }
    const now = new Date();
    return new WithdrawalRequest({
      id: randomUUID(),
      therapistId: input.therapistId,
      amount: input.amount,
      status: "PENDING",
      notes: null,
      processedAt: null,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(record: any): WithdrawalRequest {
    return new WithdrawalRequest({
      id: record.id,
      therapistId: record.therapistId,
      amount: record.amount,
      status: record.status as WithdrawalStatusType,
      notes: record.notes ?? null,
      processedAt: record.processedAt ?? null,
      requestedAt: record.requestedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public approve(notes?: string): void {
    if (this.status !== "PENDING") {
      throw ApiError.badRequest("Only pending withdrawals can be approved");
    }
    this.status = "APPROVED";
    this.notes = notes ?? null;
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }

  public reject(reason: string): void {
    if (this.status !== "PENDING") {
      throw ApiError.badRequest("Only pending withdrawals can be rejected");
    }
    this.status = "REJECTED";
    this.notes = reason;
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }

  public complete(): void {
    if (this.status !== "APPROVED") {
      throw ApiError.badRequest("Only approved withdrawals can be completed");
    }
    this.status = "COMPLETED";
    this.updatedAt = new Date();
  }

  public isOwnedByTherapist(therapistId: string): boolean {
    return this.therapistId === therapistId;
  }

  public toResponse(): WithdrawalResponse {
    return {
      id: this.id,
      therapistId: this.therapistId,
      amount: this.amount,
      status: this.status,
      notes: this.notes,
      processedAt: this.processedAt,
      requestedAt: this.requestedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
