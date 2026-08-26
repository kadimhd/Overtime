// String constants stored in the DB (SQLite has no enums; values are portable
// to Postgres enums later).

export const Role = {
  CLIENT: "CLIENT",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TaskStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const OfferStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export const PaymentStatus = {
  HELD: "HELD",
  RELEASED: "RELEASED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;

export const PaymentKind = {
  TASK_ESCROW: "TASK_ESCROW",
  SUBSCRIPTION: "SUBSCRIPTION",
} as const;

export const VerificationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  CANCELLED: "CANCELLED",
} as const;

export const DisputeStatus = {
  OPEN: "OPEN",
  RESOLVED_RELEASE: "RESOLVED_RELEASE",
  RESOLVED_REFUND: "RESOLVED_REFUND",
} as const;

// Platform commission on marketplace tasks (spec §8: 10–15%).
export const COMMISSION_RATE = 0.12;
