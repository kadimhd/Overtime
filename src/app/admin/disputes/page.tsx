import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DisputeStatus, Role } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { resolveDispute } from "@/app/actions/admin";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, StatusBadge, btnDanger, btnPrimary, inputCls } from "@/components/ui";

export default async function AdminDisputesPage() {
  await requireUser(Role.ADMIN);
  const locale = await getLocale();
  const d = t(locale);

  const disputes = await db.dispute.findMany({
    include: {
      task: { include: { client: true, offers: { where: { status: "ACCEPTED" }, include: { provider: true } } } },
      opener: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell currentPath="/admin/disputes">
      <PageTitle>{d.adminDisputes}</PageTitle>
      {disputes.length === 0 ? (
        <Card className="text-center py-10 text-slate">{d.none}</Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const provider = dispute.task.offers[0]?.provider;
            const amount = dispute.task.offers[0]?.price ?? dispute.task.budget;
            return (
              <Card key={dispute.id}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <div className="text-navy">{dispute.task.title}</div>
                    <div className="text-sm text-slate mt-0.5">
                      {dispute.task.client.name} ⇄ {provider?.name ?? "—"} · {qar(amount, locale)} ·{" "}
                      {fmtDate(dispute.createdAt, locale)}
                    </div>
                  </div>
                  <StatusBadge status={dispute.status} d={d} />
                </div>
                <p className="text-sm mt-3 bg-ivory rounded-md px-3 py-2">
                  <span className="text-slate">{dispute.opener.name}:</span> {dispute.reason}
                </p>
                {dispute.status === DisputeStatus.OPEN ? (
                  <form action={resolveDispute} className="mt-3 flex gap-2 flex-wrap items-center">
                    <input type="hidden" name="disputeId" value={dispute.id} />
                    <input
                      name="note"
                      placeholder={d.reviewComment}
                      className={`${inputCls} max-w-xs`}
                    />
                    <button name="decision" value="release" className={btnPrimary}>
                      {d.adminResolveRelease}
                    </button>
                    <button name="decision" value="refund" className={btnDanger}>
                      {d.adminResolveRefund}
                    </button>
                  </form>
                ) : dispute.adminNote ? (
                  <p className="text-sm text-slate mt-2">📝 {dispute.adminNote}</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
