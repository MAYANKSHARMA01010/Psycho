import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paymentService } from "../services/payment.service";

export class PaymentController {
  public async initiate(req: Request, res: Response) {
    const body = req.body as { sessionId: string; method: string; currency?: string };
    const data = await paymentService.initiate(req.user!.id, req.user!.role, body);
    return ApiResponse.success(res, 201, "Payment initiated successfully", data);
  }

  public async confirm(req: Request, res: Response) {
    const body = req.body as { paymentId: string; transactionId: string; gatewayResponse?: any };
    const data = await paymentService.confirm(req.user!.id, req.user!.role, body);
    return ApiResponse.success(res, 200, "Payment confirmed successfully", data);
  }

  public async refund(req: Request, res: Response) {
    const body = req.body as { reason: string };
    const data = await paymentService.refund(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
      body.reason,
    );
    return ApiResponse.success(res, 200, "Payment refunded successfully", data);
  }

  public async getInvoice(req: Request, res: Response) {
    const data = await paymentService.generateInvoice(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
    );
    return ApiResponse.success(res, 200, "Invoice generated", data);
  }

  public async getById(req: Request, res: Response) {
    const data = await paymentService.getById(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
    );
    return ApiResponse.success(res, 200, "Payment fetched", data);
  }
}

export const paymentController = new PaymentController();
