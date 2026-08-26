import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OfferStatus, Role, TaskStatus } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, StatusBadge } from "@/components/ui";

export default async function ProviderTasksPage() {
  const user = await requireUser(Role.PROVIDER);
  const locale = await getLocale();
  const d = t(locale);

  const offers = await db.offer.findMany({
    where: { providerId: user.id, status: OfferStatus.ACCEPTED },
    include: { task: { include: { category: true, client: true } } },
    orderBy: { createdAt: "desc" },
  });
  const active = offers.filter((o) => o.task.status !== TaskStatus.COMPLETED);
  const completed = offers.filter((o) => o.task.status === TaskStatus.COMPLETED);

  const section = (title: string, rows: typeof offers) => (
    <section className="mb-8">
      <h2 className="text-xl mb-4">{title}</h2>
      {rows.length === 0 ? (
        <Card className="text-center py-8 text-slate">{d.none}</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((offer) => (
            <Link key={offer.id} href={`/provider/tasks/${offer.taskId}`} className="block">
              <Card className="hover:border-gold transition-colors">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <div className="text-navy">{offer.task.title}</div>
                    <div className="text-sm text-slate mt-0.5">
                      {catName(locale, offer.task.category)} · {offer.task.client.name} ·{" "}
                      {qar(offer.price, locale)} · {fmtDate(offer.task.deadline, locale)}
                    </div>
                  </div>
                  <StatusBadge status={offer.task.status} d={d} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <Shell currentPath="/provider/tasks">
      <PageTitle>{d.navMyTasks}</PageTitle>
      {section(d.activeTasks, active)}
      {section(d.completedTasks, completed)}
    </Shell>
  );
}
