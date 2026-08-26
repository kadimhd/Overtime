import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { providerBalances } from "@/lib/payments/escrow";
import { requestWithdrawal } from "@/app/actions/provider";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, StatusBadge, btnPrimary } from "@/components/ui";

export default async function EarningsPage() {
  const user = await requireUser(Role.PROVIDER);
  const locale = await getLocale();
  const d = t(locale);

  const [balances, withdrawals] = await Promise.all([
    providerBalances(user.id),
    db.withdrawal.findMany({
      where: { providerId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <Shell currentPath="/provider/earnings">
      <PageTitle>{d.earningsTitle}</PageTitle>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card className="border-gold">
          <div className="text-slate text-sm">{d.availableBalance}</div>
          <div className="text-3xl mt-1">{qar(balances.available, locale)}</div>
          {balances.available > 0 ? (
            <form action={requestWithdrawal} className="mt-4">
              <button className={btnPrimary}>{d.withdraw}</button>
            </form>
          ) : null}
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.pendingBalance}</div>
          <div className="text-3xl mt-1">{qar(balances.pending, locale)}</div>
          <p className="text-xs text-slate mt-3">{d.escrowNote}</p>
        </Card>
      </div>

      <h2 className="text-xl mb-4">{d.withdrawals}</h2>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate border-b border-navy/10">
              <th className="text-start px-5 py-3">{d.payDate}</th>
              <th className="text-start px-5 py-3">{d.payAmount}</th>
              <th className="text-start px-5 py-3">{d.status}</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate">
                  {d.none}
                </td>
              </tr>
            ) : (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b border-navy/5">
                  <td className="px-5 py-3">{fmtDate(withdrawal.createdAt, locale)}</td>
                  <td className="px-5 py-3">{qar(withdrawal.amount, locale)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={withdrawal.status} d={d} />
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
