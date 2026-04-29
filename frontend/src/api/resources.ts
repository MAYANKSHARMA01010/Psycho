import { api } from "./client";
import type {
  AnalyticsSummary,
  Assessment,
  AvailabilitySlot,
  ChatMessage,
  Complaint,
  Earning,
  EarningsSummary,
  Notification,
  Payment,
  Prescription,
  Rating,
  Session,
  Subscription,
  Therapist,
  TreatmentPlan,
  WithdrawalRequest,
} from "./types";

// ─── Therapist ────────────────────────────────────────────────────────
export const therapistsApi = {
  search: (q: {
    specialization?: string;
    language?: string;
    minRating?: number;
    hasAvailability?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "rating" | "experience" | "createdAt";
    sortOrder?: "asc" | "desc";
  }) =>
    api.get<{ items: Therapist[] }>("/therapists", { query: q, auth: false }),
  getById: (id: string) =>
    api.get<{ therapist: Therapist; user: { id: string; name: string; email: string } }>(
      `/therapists/${id}`,
      { auth: false },
    ),
  getOwnProfile: () => api.get<{ profile: Therapist }>("/therapists/me"),
  createOwnProfile: (body: {
    licenseNumber: string;
    specialization: string;
    experience: number;
    workingHours: Record<string, unknown>;
    languages?: string[];
    bio?: string;
    hourlyRate?: number;
    bankAccountInfo?: Record<string, unknown>;
  }) => api.post<{ profile: Therapist }>("/therapists/me", body),
  updateOwnProfile: (body: Partial<{
    specialization: string;
    experience: number;
    workingHours: Record<string, unknown>;
    languages: string[];
    bio: string | null;
    hourlyRate: number | null;
    bankAccountInfo: Record<string, unknown> | null;
  }>) => api.patch<{ profile: Therapist }>("/therapists/me", body),
  uploadDocument: (body: {
    type: "LICENSE" | "ID_PROOF" | "DEGREE" | "CERTIFICATE" | "OTHER";
    fileUrl: string;
    fileName?: string;
    notes?: string;
  }) =>
    api.post<{ document: { id: string; type: string; fileUrl: string; fileName?: string | null } }>(
      "/therapists/me/documents",
      body,
    ),
  listOwnDocuments: () =>
    api.get<{ documents: Array<{ id: string; type: string; fileUrl: string; fileName?: string | null; createdAt: string }> }>(
      "/therapists/me/documents",
    ),
  deleteDocument: (id: string) => api.delete(`/therapists/me/documents/${id}`),
};

// ─── Availability ─────────────────────────────────────────────────────
export const availabilityApi = {
  createSlots: (slots: Array<{ startTime: string; endTime: string }>) =>
    api.post<{ slots: AvailabilitySlot[] }>("/availability", { slots }),
  listMine: (q: { from?: string; to?: string; onlyAvailable?: boolean } = {}) =>
    api.get<{ slots: AvailabilitySlot[] }>("/availability/me", { query: q }),
  forTherapist: (therapistId: string, q: { from?: string; to?: string } = {}) =>
    api.get<{ slots: AvailabilitySlot[] }>(`/therapists/${therapistId}/availability`, {
      query: q,
      auth: false,
    }),
  update: (slotId: string, body: { startTime?: string; endTime?: string }) =>
    api.patch<{ slot: AvailabilitySlot }>(`/availability/${slotId}`, body),
  delete: (slotId: string) => api.delete(`/availability/${slotId}`),
};

// ─── Sessions ─────────────────────────────────────────────────────────
export const sessionsApi = {
  book: (body: { therapistId: string; slotId: string; type: "VIDEO" | "VOICE" | "CHAT" }) =>
    api.post<{ session: Session }>("/sessions", body),
  history: (q: { status?: string; page?: number; limit?: number } = {}) =>
    api.get<{ items: Session[] }>("/sessions/history", { query: q }),
  getById: (id: string) => api.get<{ session: Session }>(`/sessions/${id}`),
  confirm: (id: string) => api.patch<{ session: Session }>(`/sessions/${id}/confirm`),
  start: (id: string) => api.patch<{ session: Session }>(`/sessions/${id}/start`),
  complete: (id: string) => api.patch<{ session: Session }>(`/sessions/${id}/complete`),
  cancel: (id: string, reason: string) =>
    api.patch<{ session: Session }>(`/sessions/${id}/cancel`, { reason }),
  reschedule: (id: string, slotId: string) =>
    api.patch<{ session: Session }>(`/sessions/${id}/reschedule`, { slotId }),
  addNotes: (id: string, notes: string) =>
    api.post<{ session: Session }>(`/sessions/${id}/notes`, { notes }),
  getNotes: (id: string) => api.get<{ notes: string | null }>(`/sessions/${id}/notes`),
};

// ─── Chat ─────────────────────────────────────────────────────────────
export const chatApi = {
  history: (sessionId: string, q: { page?: number; limit?: number } = {}) =>
    api.get<{ messages: ChatMessage[] }>(`/sessions/${sessionId}/chat/history`, { query: q }),
  send: (sessionId: string, content: string) =>
    api.post<{ message: ChatMessage }>(`/sessions/${sessionId}/chat/messages`, { content }),
  markRead: (sessionId: string) => api.patch(`/sessions/${sessionId}/chat/read`),
  unreadCount: (sessionId: string) =>
    api.get<{ unreadCount: number }>(`/sessions/${sessionId}/chat/unread`),
};

// ─── Payments ─────────────────────────────────────────────────────────
export const paymentsApi = {
  initiate: (body: { sessionId: string; method: "UPI" | "CARD" | "NET_BANKING" | "WALLET"; currency?: string }) =>
    api.post<{ payment: Payment; gateway: { gatewayOrderId: string; amount: number; currency: string; status: string } }>(
      "/payments/initiate",
      body,
    ),
  confirm: (body: { paymentId: string; transactionId: string; gatewayResponse?: unknown }) =>
    api.post<{ payment: Payment }>("/payments/confirm", body),
  refund: (id: string, reason: string) =>
    api.post<{ payment: Payment }>(`/payments/${id}/refund`, { reason }),
  getById: (id: string) => api.get<{ payment: Payment }>(`/payments/${id}`),
  invoice: (id: string) => api.get<{ invoice: Record<string, unknown> }>(`/payments/${id}/invoice`),
};

// ─── Subscription ─────────────────────────────────────────────────────
export const subscriptionApi = {
  mine: () => api.get<{ subscription: Subscription }>("/subscriptions/me"),
  create: (planName: string) => api.post<{ subscription: Subscription }>("/subscriptions", { planName }),
  renew: (id: string) => api.post<{ subscription: Subscription }>(`/subscriptions/${id}/renew`),
  cancel: (id: string) => api.post<{ subscription: Subscription }>(`/subscriptions/${id}/cancel`),
};

// ─── Financial (therapist + admin) ───────────────────────────────────
export const financialApi = {
  myEarnings: (q: { isPaid?: boolean; page?: number; limit?: number } = {}) =>
    api.get<{ earnings: Earning[]; total: number }>("/financial/earnings", { query: q }),
  earningsSummary: () =>
    api.get<{ summary: EarningsSummary }>("/financial/earnings/summary"),
  myWithdrawals: (q: { page?: number; limit?: number } = {}) =>
    api.get<{ withdrawals: WithdrawalRequest[]; total?: number }>("/financial/withdrawals", { query: q }),
  requestWithdrawal: (body: { amount: number; notes?: string }) =>
    api.post<{ withdrawal: WithdrawalRequest }>("/financial/withdrawals", body),
  updateWithdrawal: (id: string, body: { status: "APPROVED" | "REJECTED" | "COMPLETED"; notes?: string }) =>
    api.patch<{ withdrawal: WithdrawalRequest }>(`/financial/withdrawals/${id}`, body),
  transactions: (q: { page?: number; limit?: number; status?: string } = {}) =>
    api.get<{ payments: Payment[]; total: number }>("/financial/transactions", { query: q }),
};

// ─── Assessment ──────────────────────────────────────────────────────
export const assessmentApi = {
  submit: (body: { responses: unknown; completedAt?: string }) =>
    api.post<{ assessment: Assessment }>("/assessments", body),
  mine: (q: { page?: number; limit?: number } = {}) =>
    api.get<{ items?: Assessment[]; assessments?: Assessment[] }>("/assessments/me", { query: q }),
  getById: (id: string) => api.get<{ assessment: Assessment }>(`/assessments/${id}`),
  forClient: (clientId: string) =>
    api.get<{ items?: Assessment[]; assessments?: Assessment[] }>(
      `/clients/${clientId}/assessments`,
    ),
};

// ─── Treatment Plan ──────────────────────────────────────────────────
export const treatmentPlanApi = {
  create: (body: {
    clientId: string;
    assessmentId: string;
    goals: string;
    milestones: Array<{ title: string; description?: string }>;
    startDate: string;
    endDate?: string;
  }) => api.post<{ treatmentPlan: TreatmentPlan }>("/treatment-plans", body),
  mine: (q: { page?: number; limit?: number } = {}) =>
    api.get<{ items?: TreatmentPlan[]; treatmentPlans?: TreatmentPlan[] }>("/treatment-plans/me", {
      query: q,
    }),
  getById: (id: string) =>
    api.get<{ treatmentPlan: TreatmentPlan }>(`/treatment-plans/${id}`),
  updateMilestone: (planId: string, milestoneId: string, body: { progress: number; note?: string }) =>
    api.patch<{ treatmentPlan: TreatmentPlan }>(
      `/treatment-plans/${planId}/milestones/${milestoneId}`,
      body,
    ),
  updateStatus: (planId: string, body: { status: "active" | "paused" | "completed" }) =>
    api.patch<{ treatmentPlan: TreatmentPlan }>(`/treatment-plans/${planId}/status`, body),
};

// ─── Prescription ────────────────────────────────────────────────────
export const prescriptionApi = {
  create: (body: {
    clientId: string;
    sessionId?: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration?: string;
      notes?: string;
    }>;
    instructions: string;
    diagnosis?: string;
  }) => api.post<{ prescription: Prescription }>("/prescriptions", body),
  mine: (q: { page?: number; limit?: number } = {}) =>
    api.get<{ items?: Prescription[]; prescriptions?: Prescription[] }>("/prescriptions/me", {
      query: q,
    }),
  getById: (id: string) =>
    api.get<{ prescription: Prescription }>(`/prescriptions/${id}`),
  pdf: (id: string) => api.get<{ pdfUrl: string }>(`/prescriptions/${id}/pdf`),
  share: (id: string, body: { recipientEmail: string }) =>
    api.post(`/prescriptions/${id}/share`, body),
};

// ─── Rating ──────────────────────────────────────────────────────────
export const ratingApi = {
  create: (body: { sessionId: string; score: number; review?: string }) =>
    api.post<{ rating: Rating }>("/ratings", body),
  mine: () => api.get<{ items?: Rating[]; ratings?: Rating[] }>("/ratings/me"),
  forTherapist: (therapistId: string) =>
    api.get<{ items?: Rating[]; ratings?: Rating[]; average?: number }>(
      `/therapists/${therapistId}/ratings`,
      { auth: false },
    ),
};

// ─── Complaint ───────────────────────────────────────────────────────
export const complaintApi = {
  raise: (body: { againstId: string; description: string }) =>
    api.post<{ complaint: Complaint }>("/complaints", body),
  mine: (q: { page?: number; limit?: number; status?: string } = {}) =>
    api.get<{ items?: Complaint[]; complaints?: Complaint[] }>("/complaints/me", { query: q }),
  getById: (id: string) => api.get<{ complaint: Complaint }>(`/complaints/${id}`),
  // Admin
  listAll: (q: { page?: number; limit?: number; status?: string } = {}) =>
    api.get<{ items?: Complaint[]; complaints?: Complaint[] }>("/complaints/admin/complaints", {
      query: q,
    }),
  review: (id: string, body: { status: string; resolution?: string }) =>
    api.patch<{ complaint: Complaint }>(`/complaints/admin/complaints/${id}`, body),
};

// ─── Notification ────────────────────────────────────────────────────
export const notificationApi = {
  mine: (q: { page?: number; limit?: number; isRead?: boolean } = {}) =>
    api.get<{ items?: Notification[]; notifications?: Notification[]; unreadCount?: number }>(
      "/notifications/me",
      { query: q },
    ),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

// ─── Admin ───────────────────────────────────────────────────────────
export const adminApi = {
  listTherapists: (q: { status?: "PENDING" | "APPROVED" | "REJECTED"; page?: number; limit?: number } = {}) =>
    api.get<{ items: Array<Therapist & { user?: { id: string; name: string; email: string } }> }>(
      "/admin/therapists",
      { query: q },
    ),
  getTherapist: (id: string) =>
    api.get<{ therapist: Therapist; documents: Array<{ id: string; type: string; fileUrl: string }> }>(
      `/admin/therapists/${id}`,
    ),
  approveTherapist: (id: string) => api.post(`/admin/therapists/${id}/approve`),
  rejectTherapist: (id: string, reason: string) =>
    api.post(`/admin/therapists/${id}/reject`, { reason }),
  // Dashboard
  analytics: () => api.get<AnalyticsSummary>("/admin/analytics"),
  highRisk: (q: { page?: number; limit?: number } = {}) =>
    api.get<{ items?: unknown[]; users?: unknown[] }>("/admin/crisis/high-risk", { query: q }),
  notificationsSummary: () => api.get<{ summary: Record<string, number> }>("/admin/notifications/summary"),
};

// ─── Profile (legacy creation routes) ────────────────────────────────
export const profileApi = {
  createClient: (body: {
    language?: string;
    gender?: string;
    emergencyContact?: string;
    dataVisibility?: "private" | "therapist_only" | "shared";
  }) => api.post("/profile/client", body),
  createAdmin: (body: { adminLevel?: number; department?: string }) =>
    api.post("/profile/admin", body),
};
