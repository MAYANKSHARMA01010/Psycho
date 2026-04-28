import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { financialService } from "../services/financial.service";

export class FinancialController {
  public async getEarnings(req: Request, res: Response) {
    const query = req.query as { isPaid?: string; page?: string; limit?: string };
    const data = await financialService.getEarnings(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Earnings fetched", data);
  }

  public async getEarningsSummary(req: Request, res: Response) {
    const data = await financialService.getEarningsSummary(req.user!.id, req.user!.role);
    return ApiResponse.success(res, 200, "Earnings summary fetched", data);
  }

  public async requestWithdrawal(req: Request, res: Response) {
    const body = req.body as { amount: number };
    const data = await financialService.requestWithdrawal(req.user!.id, req.user!.role, body);
    return ApiResponse.success(res, 201, "Withdrawal requested successfully", data);
  }

  public async getWithdrawals(req: Request, res: Response) {
    const query = req.query as { status?: string; page?: string; limit?: string };
    const data = await financialService.getWithdrawals(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Withdrawals fetched", data);
  }

  public async processWithdrawal(req: Request, res: Response) {
    const body = req.body as { action: "approve" | "reject"; notes?: string };
    const data = await financialService.processWithdrawal(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
      body,
    );
    return ApiResponse.success(res, 200, "Withdrawal processed", data);
  }

  public async getTransactionHistory(req: Request, res: Response) {
    const query = req.query as { page?: string; limit?: string };
    const data = await financialService.getTransactionHistory(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Transaction history fetched", data);
  }
}

export const financialController = new FinancialController();
