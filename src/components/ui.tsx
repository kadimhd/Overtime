import { statusLabel, type Dict } from "@/lib/i18n";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-navy/10 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl text-navy">{children}</h1>
      {sub ? <p className="text-slate mt-1">{sub}</p> : null}
    </div>
  );
}

const statusColors: Record<string, string> = {
  OPEN: "bg-gold/15 text-navy border-gold/40",
  IN_PROGRESS: "bg-navy/10 text-navy border-navy/30",
  DELIVERED: "bg-gold/25 text-navy border-gold/50",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-slate/10 text-slate border-slate/30",
  DISPUTED: "bg-red-50 text-red-800 border-red-200",
  PENDING: "bg-gold/15 text-navy border-gold/40",
  ACCEPTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-slate/10 text-slate border-slate/30",
  HELD: "bg-gold/15 text-navy border-gold/40",
  RELEASED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REFUNDED: "bg-slate/10 text-slate border-slate/30",
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REQUESTED: "bg-gold/15 text-navy border-gold/40",
};

export function StatusBadge({ status, d }: { status: string; d: Dict }) {
  const color = statusColors[status] ?? "bg-slate/10 text-slate border-slate/30";
  return (
    <span className={`inline-block text-xs border rounded-full px-2.5 py-0.5 ${color}`}>
      {statusLabel(d, status)}
    </span>
  );
}

export const btnPrimary =
  "inline-block bg-gold text-navy rounded-md px-4 py-2 text-sm hover:bg-gold-soft cursor-pointer disabled:opacity-50";
export const btnSecondary =
  "inline-block border border-navy/25 text-navy rounded-md px-4 py-2 text-sm hover:border-gold hover:text-gold cursor-pointer";
export const btnDanger =
  "inline-block border border-red-300 text-red-700 rounded-md px-4 py-2 text-sm hover:bg-red-50 cursor-pointer";
export const inputCls =
  "w-full border border-navy/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gold";
export const labelCls = "block text-sm text-slate mb-1";
