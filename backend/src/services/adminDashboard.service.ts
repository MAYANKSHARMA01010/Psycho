import { ComplaintStatus, PaymentStatus, Role, SessionStatus } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { crisisMonitoringService } from "./crisisMonitoring.service";
import { notificationService } from "./notification.service";

export interface AnalyticsQuery {
  from?: Date;
  to?: Date;
}

export class AdminDashboardService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async getAnalytics(userRole: string, query: AnalyticsQuery = {}) {
    this.ensureAdmin(userRole);

    const db = await this.db();
    const { from, to } = this.resolveRange(query.from, query.to, 30);

    const [users, payments, sessions] = await Promise.all([
      db.user.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { id: true, role: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.payment.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          paidAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      db.session.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: {
          id: true,
          status: true,
          type: true,
          createdAt: true,
          scheduledAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const growthByDay = this.groupByDay(users.map((u) => u.createdAt));

    const usersByRole = {
      CLIENT: users.filter((u) => u.role === Role.CLIENT).length,
      THERAPIST: users.filter((u) => u.role === Role.THERAPIST).length,
      ADMIN: users.filter((u) => u.role === Role.ADMIN).length,
    };

    const completedPayments = payments.filter((p) => p.status === PaymentStatus.COMPLETED);
    const refundedPayments = payments.filter((p) => p.status === PaymentStatus.REFUNDED);

    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalRefunded = refundedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const revenueByDay = this.groupNumericByDay(
      completedPayments.map((payment) => ({
        date: payment.paidAt ?? payment.createdAt,
        value: payment.amount,
      })),
    );

    const sessionsByStatus = {
      PENDING: sessions.filter((s) => s.status === SessionStatus.PENDING).length,
      CONFIRMED: sessions.filter((s) => s.status === SessionStatus.CONFIRMED).length,
      ONGOING: sessions.filter((s) => s.status === SessionStatus.ONGOING).length,
      COMPLETED: sessions.filter((s) => s.status === SessionStatus.COMPLETED).length,
      CANCELLED: sessions.filter((s) => s.status === SessionStatus.CANCELLED).length,
      RESCHEDULED: sessions.filter((s) => s.status === SessionStatus.RESCHEDULED).length,
    };

    const completionRate =
      sessions.length === 0
        ? 0
        : Math.round((sessionsByStatus.COMPLETED / sessions.length) * 10000) / 100;

    const averageSessionVolumePerDay =
      this.daysBetween(from, to) === 0
        ? sessions.length
        : Math.round((sessions.length / this.daysBetween(from, to)) * 100) / 100;

    return {
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      userGrowth: {
        totalNewUsers: users.length,
        byRole: usersByRole,
        byDay: growthByDay,
      },
      revenue: {
        totalRevenue,
        totalRefunded,
        netRevenue: totalRevenue - totalRefunded,
        completedPayments: completedPayments.length,
        refundedPayments: refundedPayments.length,
        byDay: revenueByDay,
      },
      sessions: {
        totalSessions: sessions.length,
        byStatus: sessionsByStatus,
        completionRate,
        averageSessionVolumePerDay,
      },
    };
  }

  public async getComplaintSummary(userRole: string, query: AnalyticsQuery = {}) {
    this.ensureAdmin(userRole);

    const db = await this.db();
    const { from, to } = this.resolveRange(query.from, query.to, 30);

    const complaints = await db.complaint.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const opened = complaints.length;
    const resolved = complaints.filter((c) => c.status === ComplaintStatus.RESOLVED).length;
    const dismissed = complaints.filter((c) => c.status === ComplaintStatus.DISMISSED).length;
    const underReview = complaints.filter((c) => c.status === ComplaintStatus.UNDER_REVIEW).length;
    const open = complaints.filter((c) => c.status === ComplaintStatus.OPEN).length;

    const avgResolutionHours = this.calculateAverageResolutionHours(complaints);

    return {
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals: {
        opened,
        open,
        underReview,
        resolved,
        dismissed,
      },
      avgResolutionHours,
      byDay: this.groupByDay(complaints.map((c) => c.createdAt)),
    };
  }

  public async getHighRiskUsers(
    userRole: string,
    options: { days?: number; limit?: number } = {},
  ) {
    this.ensureAdmin(userRole);
    return crisisMonitoringService.getHighRiskUsers(userRole, options);
  }

  public async getNotificationSummary(userRole: string) {
    this.ensureAdmin(userRole);
    return notificationService.getAdminSummary(userRole);
  }

  private resolveRange(from: Date | undefined, to: Date | undefined, defaultDays: number) {
    const rangeEnd = to ?? new Date();
    const rangeStart =
      from ?? new Date(rangeEnd.getTime() - defaultDays * 24 * 60 * 60 * 1000);

    if (rangeStart > rangeEnd) {
      throw ApiError.badRequest("Invalid date range: 'from' must be before 'to'");
    }

    return { from: rangeStart, to: rangeEnd };
  }

  private groupByDay(dates: Date[]) {
    const buckets = new Map<string, number>();

    dates.forEach((date) => {
      const day = date.toISOString().slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    });

    return [...buckets.entries()].map(([date, count]) => ({ date, count }));
  }

  private groupNumericByDay(entries: Array<{ date: Date; value: number }>) {
    const buckets = new Map<string, number>();

    entries.forEach((entry) => {
      const day = entry.date.toISOString().slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + entry.value);
    });

    return [...buckets.entries()].map(([date, total]) => ({ date, total }));
  }

  private daysBetween(from: Date, to: Date) {
    return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
  }

  private calculateAverageResolutionHours(
    complaints: Array<{ createdAt: Date; resolvedAt: Date | null }>,
  ) {
    const resolved = complaints.filter((c) => c.resolvedAt !== null);

    if (resolved.length === 0) {
      return 0;
    }

    const totalHours = resolved.reduce((sum, complaint) => {
      const diffMs = (complaint.resolvedAt as Date).getTime() - complaint.createdAt.getTime();
      return sum + diffMs / (1000 * 60 * 60);
    }, 0);

    return Math.round((totalHours / resolved.length) * 100) / 100;
  }

  private ensureAdmin(userRole: string) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can access dashboard analytics");
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
