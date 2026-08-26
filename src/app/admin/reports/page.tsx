import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PaymentKind, PaymentStatus, Role, SubscriptionStatus } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, StatusBadge } from "@/components/ui";

export default async function AdminReportsPage() {
  await requireUser(Role.ADMIN);
  const locale = await getLocale();
  const d = t(locale);

  const [payments, activeSubs] = await Promise.all([
    db.payment.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    db.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { package: true },
    }),
  ]);

  const gross = payments
    .filter((p) => p.status !== PaymentStatus.FAILED && p.status !== PaymentStatus.REFUNDED)
    .reduce((sum, p) => sum + p.amount, 0);
  const commission = payments
    .filter((p) => p.kind === PaymentKind.TASK_ESCROW && p.status === PaymentStatus.RELEASED)
    .reduce((sum, p) => sum + p.commission, 0);
  const mrr = activeSubs.reduce((sum, sub) => sum + sub.package.priceMonthly, 0);

  return (
    <Shell currentPath="/admin/reports">
      <PageTitle>{d.adminReports}</PageTitle>
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-slate text-sm">{d.adminTotalRevenue}</div>
          <div className="text-3xl mt-1">{qar(gross, locale)}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.adminCommission}</div>
          <div className="text-3xl mt-1">{qar(commission, locale)}</div>
        </Card>
        <Card className="border-gold">
          <div className="text-slate text-sm">{d.adminMrr}</div>
          <div className="text-3xl mt-1">{qar(mrr, locale)}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.adminActiveSubs}</div>
          <div className="text-3xl mt-1">{activeSubs.length}</div>
        </Card>
      </div>

      <h2 className="text-xl mb-4">{d.paymentHistory}</h2>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate border-b border-navy/10">
              <th className="text-start px-5 py-3">{d.payDate}</th>
              <th className="text-start px-5 py-3">{d.yourName}</th>
              <th className="text-start px-5 py-3">{d.payKind}</th>
              <th className="text-start px-5 py-3">{d.payAmount}</th>
              <th className="text-start px-5 py-3">{d.adminCommission}</th>
              <th className="text-start px-5 py-3">{d.status}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-navy/5">
                <td className="px-5 py-3">{fmtDate(payment.createdAt, locale)}</td>
                <td className="px-5 py-3">{payment.user.name}</td>
                <td className="px-5 py-3">
                  {d[`payKind${payment.kind}` as "payKindTASK_ESCROW"] ?? payment.kind}
                </td>
                <td className="px-5 py-3">{qar(payment.amount, locale)}</td>
                <td className="px-5 py-3">{qar(payment.commission, locale)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={payment.status} d={d} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
