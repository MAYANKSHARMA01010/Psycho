import { Role } from "../constants/roles";
import {
  EarningRepository,
  earningRepository,
} from "../repositories/EarningRepository";
import { ApiError } from "../utils/ApiError";

export class EarningService {
  constructor(private readonly earnings: EarningRepository = earningRepository) {}

  public async listOwn(
    userId: string,
    userRole: string,
    pagination: { page: number; limit: number; isPaid?: boolean },
  ) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can view earnings");
    }
    const result = await this.earnings.listForTherapist(userId, pagination);
    return {
      items: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async summary(userId: string, userRole: string) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can view earnings summary");
    }
    const summary = await this.earnings.summaryForTherapist(userId);
    const availableBalance = await this.earnings.availableBalance(userId);
    return { summary, availableBalance };
  }
}

export const earningService = new EarningService();
