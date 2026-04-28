import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { earningService } from "../services/earning.service";
import { withdrawalService } from "../services/withdrawal.service";

export class EarningController {
  public async listOwn(req: Request, res: Response) {
    const q = req.query as unknown as { page: number; limit: number; isPaid?: string };
    const isPaid = q.isPaid === "true" ? true : q.isPaid === "false" ? false : undefined;
    const data = await earningService.listOwn(req.user!.id, req.user!.role, {
      page: q.page,
      limit: q.limit,
      isPaid,
    });
    return ApiResponse.success(res, 200, "Earnings fetched", data);
  }

  public async summary(req: Request, res: Response) {
    const data = await earningService.summary(req.user!.id, req.user!.role);
    return ApiResponse.success(res, 200, "Earnings summary fetched", data);
  }

  public async requestWithdrawal(req: Request, res: Response) {
    const body = req.body as { amount: number; notes?: string };
    const data = await withdrawalService.request(
      req.user!.id,
      req.user!.role,
      body.amount,
      body.notes,
    );
    return ApiResponse.success(res, 201, "Withdrawal requested", data);
  }

  public async listOwnWithdrawals(req: Request, res: Response) {
    const q = req.query as unknown as { page: number; limit: number };
    const data = await withdrawalService.listOwn(req.user!.id, req.user!.role, q);
    return ApiResponse.success(res, 200, "Withdrawals fetched", data);
  }
}

export class AdminWithdrawalController {
  public async list(req: Request, res: Response) {
    const q = req.query as unknown as { page: number; limit: number; status?: string };
    const data = await withdrawalService.listAll(req.user!.role, q);
    return ApiResponse.success(res, 200, "Withdrawals fetched", data);
  }

  public async approve(req: Request, res: Response) {
    const data = await withdrawalService.approve(req.user!.role, String(req.params.withdrawalId));
    return ApiResponse.success(res, 200, "Withdrawal approved", data);
  }

  public async reject(req: Request, res: Response) {
    const body = req.body as { reason: string };
    const data = await withdrawalService.reject(
      req.user!.role,
      String(req.params.withdrawalId),
      body.reason,
    );
    return ApiResponse.success(res, 200, "Withdrawal rejected", data);
  }

  public async markPaid(req: Request, res: Response) {
    const data = await withdrawalService.markPaid(req.user!.role, String(req.params.withdrawalId));
    return ApiResponse.success(res, 200, "Withdrawal marked paid", data);
  }
}

export const earningController = new EarningController();
export const adminWithdrawalController = new AdminWithdrawalController();
