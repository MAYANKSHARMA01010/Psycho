export type Role = "CLIENT" | "THERAPIST" | "ADMIN";

export type Therapist = {
  id: string;
  licenseNumber: string;
  specialization: string;
  languages?: string[];
  isVerified: boolean;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  rating: number;
  totalRatings: number;
  workingHours: unknown;
  bio: string | null;
  experience: number;
  hourlyRate?: number | null;
  user?: { id: string; name: string; email: string };
};

export type AvailabilitySlot = {
  id: string;
  therapistId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

export type Session = {
  id: string;
  clientId: string;
  therapistId: string;
  status: "PENDING" | "CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  type: "VIDEO" | "VOICE" | "CHAT";
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  notes?: string | null;
  cancellationReason?: string | null;
  client?: { id: string; user: { name: string; email: string } };
  therapist?: { id: string; user: { name: string; email: string } };
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type Payment = {
  id: string;
  clientId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  method: string;
  transactionId: string | null;
  refundReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Subscription = {
  id: string;
  clientId: string;
  planName: string;
  price: number;
  currency: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  autoRenew: boolean;
  startDate: string;
  endDate: string;
} | null;

export type Earning = {
  id: string;
  therapistId: string;
  sessionId: string;
  amount: number;
  platformCommission: number;
  netAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
};

export type WithdrawalRequest = {
  id: string;
  therapistId: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  notes: string | null;
  processedAt: string | null;
  requestedAt: string;
};

export type Assessment = {
  id: string;
  clientId: string;
  responses: unknown;
  score: number;
  severity: string;
  completedAt: string;
  createdAt: string;
};

export type TreatmentPlan = {
  id: string;
  clientId: string;
  therapistId: string;
  assessmentId: string;
  goals: string;
  milestones: Array<{
    id: string;
    title: string;
    description?: string;
    progress: number;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    updatedAt: string;
  }>;
  status: string;
  startDate: string;
  endDate: string | null;
};

export type Prescription = {
  id: string;
  therapistId: string;
  clientId: string;
  sessionId?: string | null;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    notes?: string;
  }>;
  instructions: string;
  diagnosis?: string | null;
  pdfUrl?: string | null;
  issuedAt: string;
};

export type Rating = {
  id: string;
  clientId: string;
  therapistId: string;
  sessionId: string;
  score: number;
  review: string | null;
  createdAt: string;
};

export type Complaint = {
  id: string;
  raisedById: string;
  againstId: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type:
    | "SESSION_REMINDER"
    | "MEDICATION_REMINDER"
    | "AI_NUDGE"
    | "COMPLAINT_UPDATE"
    | "PAYMENT_UPDATE"
    | "CRISIS_ALERT";
  channel: "PUSH" | "EMAIL" | "SMS";
  title: string;
  message: string;
  isRead: boolean;
  metadata: unknown;
  sentAt: string;
};

export type AnalyticsSummary = {
  users?: { total: number; clients: number; therapists: number; admins: number };
  sessions?: { total: number; completed: number; cancelled: number; upcoming: number };
  revenue?: { gross: number; refunded: number; net: number };
  ratings?: { average: number; total: number };
  [key: string]: unknown;
};

export type EarningsSummary = {
  totalEarned: number;
  totalCommission: number;
  totalNet: number;
  totalPaid: number;
  availableBalance: number;
};
