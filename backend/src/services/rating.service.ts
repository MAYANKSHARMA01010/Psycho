import { Role, SessionStatus } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

export interface CreateRatingPayload {
  sessionId: string;
  score: number;
  review?: string;
}

export class RatingService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(userId: string, userRole: string, payload: CreateRatingPayload) {
    if (userRole !== Role.CLIENT) {
      throw ApiError.forbidden("Only clients can submit ratings");
    }

    const db = await this.db();

    const session = await db.session.findUnique({
      where: { id: payload.sessionId },
      select: {
        id: true,
        clientId: true,
        therapistId: true,
        status: true,
      },
    });

    if (session === null) {
      throw ApiError.notFound("Session");
    }

    if (session.clientId !== userId) {
      throw ApiError.forbidden("You can only rate your own sessions");
    }

    if (session.status !== SessionStatus.COMPLETED) {
      throw ApiError.badRequest("Only completed sessions can be rated");
    }

    const existing = await db.rating.findUnique({
      where: { sessionId: payload.sessionId },
      select: { id: true },
    });

    if (existing !== null) {
      throw ApiError.conflict("This session has already been rated");
    }

    const rating = await db.rating.create({
      data: {
        clientId: userId,
        therapistId: session.therapistId,
        sessionId: payload.sessionId,
        score: payload.score,
        review: payload.review?.trim() || null,
      },
      include: {
        client: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    const aggregate = await db.rating.aggregate({
      where: { therapistId: session.therapistId },
      _avg: { score: true },
      _count: { _all: true },
    });

    await db.therapist.update({
      where: { id: session.therapistId },
      data: {
        rating: aggregate._avg.score ?? 0,
        totalRatings: aggregate._count._all,
      },
    });

    await notificationService.sendToUsers({
      userIds: [session.therapistId],
      type: "AI_NUDGE",
      channels: ["PUSH"],
      title: "New Session Review",
      message: `You received a ${payload.score}/5 review from ${rating.client.user.name}.`,
      metadata: {
        ratingId: rating.id,
        sessionId: session.id,
        score: payload.score,
      },
      clientId: userId,
    });

    return { rating };
  }

  public async listMine(userId: string, userRole: string, options: { page?: number; limit?: number }) {
    if (userRole === Role.CLIENT) {
      return this.listForClient(userId, options);
    }

    if (userRole === Role.THERAPIST) {
      return this.listForTherapist(userId, options);
    }

    if (userRole === Role.ADMIN) {
      return this.listAll(options);
    }

    throw ApiError.forbidden("Unsupported role for ratings list");
  }

  public async listForTherapist(
    therapistId: string,
    options: { page?: number; limit?: number },
  ) {
    const db = await this.db();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const [ratings, total, summary] = await Promise.all([
      db.rating.findMany({
        where: { therapistId },
        include: {
          client: { select: { id: true, user: { select: { name: true, email: true } } } },
          session: { select: { id: true, scheduledAt: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.rating.count({ where: { therapistId } }),
      db.rating.aggregate({
        where: { therapistId },
        _avg: { score: true },
        _count: { _all: true },
      }),
    ]);

    return {
      ratings,
      summary: {
        average: summary._avg.score ?? 0,
        totalRatings: summary._count._all,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async listForClient(clientId: string, options: { page?: number; limit?: number }) {
    const db = await this.db();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      db.rating.findMany({
        where: { clientId },
        include: {
          therapist: { select: { id: true, user: { select: { name: true, email: true } } } },
          session: { select: { id: true, scheduledAt: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.rating.count({ where: { clientId } }),
    ]);

    return {
      ratings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async listAll(options: { page?: number; limit?: number }) {
    const db = await this.db();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      db.rating.findMany({
        include: {
          client: { select: { id: true, user: { select: { name: true, email: true } } } },
          therapist: { select: { id: true, user: { select: { name: true, email: true } } } },
          session: { select: { id: true, scheduledAt: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.rating.count(),
    ]);

    return {
      ratings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

export const ratingService = new RatingService();
