import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OfferStatus, PaymentStatus, Role, SubscriptionStatus, TaskStatus } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, StatusBadge, btnPrimary } from "@/components/ui";

export default async function DashboardPage() {
  const user = await requireUser(Role.CLIENT);
  const locale = await getLocale();
  const d = t(locale);

  const [tasks, subscription, heldPayments, pendingOffers] = await Promise.all([
    db.task.findMany({
      where: { clientId: user.id },
      include: { category: true, offers: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.subscription.findFirst({
      where: { clientId: user.id, status: SubscriptionStatus.ACTIVE },
      include: { package: true },
    }),
    db.payment.aggregate({
      where: { userId: user.id, status: PaymentStatus.HELD },
      _sum: { amount: true },
    }),
    db.offer.count({
      where: {
        status: OfferStatus.PENDING,
        task: { clientId: user.id, status: TaskStatus.OPEN },
      },
    }),
  ]);

  const active = tasks.filter(
    (task) => task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED,
  );

  return (
    <Shell currentPath="/dashboard">
      <PageTitle>
        {d.dashWelcome}، {user.name} 👋
      </PageTitle>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-slate text-sm">{d.dashActiveTasks}</div>
          <div className="text-3xl mt-1">{active.length}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.dashOpenOffers}</div>
          <div className="text-3xl mt-1">{pendingOffers}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.totalHeld}</div>
          <div className="text-3xl mt-1">{qar(heldPayments._sum.amount ?? 0, locale)}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.dashCurrentPackage}</div>
          {subscription ? (
            <div className="mt-1">
              <div className="text-lg">
                {locale === "ar" ? subscription.package.nameAr : subscription.package.nameEn}
              </div>
              <div className="text-sm text-slate">
                {subscription.hoursUsed}/{subscription.package.hoursPerMonth} {d.hours}
              </div>
            </div>
          ) : (
            <Link href="/retainers" className="text-sm text-gold hover:underline mt-1 inline-block">
              {d.dashNoPackage}
            </Link>
          )}
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl">{d.dashRecentTasks}</h2>
        <Link href="/tasks/new" className={btnPrimary}>
          {d.navPostTask}
        </Link>
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate mb-4">{d.dashPostFirst}</p>
          <Link href="/tasks/new" className={btnPrimary}>
            {d.navPostTask}
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="block">
              <Card className="hover:border-gold transition-colors">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <div className="text-navy">{task.title}</div>
                    <div className="text-sm text-slate mt-0.5">
                      {catName(locale, task.category)} · {qar(task.budget, locale)} ·{" "}
                      {fmtDate(task.deadline, locale)}
                    </div>
                  </div>
                  {task.status === TaskStatus.OPEN && task.offers.length > 0 ? (
                    <span className="text-sm text-gold">
                      {task.offers.length} {d.offersReceived}
                    </span>
                  ) : null}
                  <StatusBadge status={task.status} d={d} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
