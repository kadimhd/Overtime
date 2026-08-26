import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PaymentStatus, Role } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, StatusBadge } from "@/components/ui";

export default async function WalletPage() {
  const user = await requireUser(Role.CLIENT);
  const locale = await getLocale();
  const d = t(locale);

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const held = payments
    .filter((p) => p.status === PaymentStatus.HELD)
    .reduce((sum, p) => sum + p.amount, 0);
  const spent = payments
    .filter((p) => p.status === PaymentStatus.RELEASED)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Shell currentPath="/wallet">
      <PageTitle>{d.walletTitle}</PageTitle>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <div className="text-slate text-sm">{d.totalHeld}</div>
          <div className="text-3xl mt-1">{qar(held, locale)}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.totalSpent}</div>
          <div className="text-3xl mt-1">{qar(spent, locale)}</div>
        </Card>
      </div>

      <h2 className="text-xl mb-4">{d.paymentHistory}</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-slate border-b border-navy/10">
              <th className="text-start px-5 py-3">{d.payDate}</th>
              <th className="text-start px-5 py-3">{d.payKind}</th>
              <th className="text-start px-5 py-3">{d.payAmount}</th>
              <th className="text-start px-5 py-3">{d.status}</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate">
                  {d.none}
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-navy/5">
                  <td className="px-5 py-3">{fmtDate(payment.createdAt, locale)}</td>
                  <td className="px-5 py-3">
                    {d[`payKind${payment.kind}` as "payKindTASK_ESCROW"] ?? payment.kind}
                  </td>
                  <td className="px-5 py-3">{qar(payment.amount, locale)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={payment.status} d={d} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
