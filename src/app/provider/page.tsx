import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OfferStatus, Role, TaskStatus } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { providerBalances } from "@/lib/payments/escrow";
import { Shell } from "@/components/Shell";
import { Card, StatusBadge, btnPrimary } from "@/components/ui";

export default async function ProviderDashboardPage() {
  const user = await requireUser(Role.PROVIDER);
  const locale = await getLocale();
  const d = t(locale);

  const [profile, offers, balances] = await Promise.all([
    db.providerProfile.findUnique({
      where: { userId: user.id },
      include: { verification: true },
    }),
    db.offer.findMany({
      where: { providerId: user.id },
      include: { task: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    providerBalances(user.id),
  ]);

  const activeTasks = offers.filter(
    (offer) =>
      offer.status === OfferStatus.ACCEPTED &&
      (offer.task.status === TaskStatus.IN_PROGRESS || offer.task.status === TaskStatus.DELIVERED),
  );
  const pendingOffers = offers.filter(
    (offer) => offer.status === OfferStatus.PENDING && offer.task.status === TaskStatus.OPEN,
  );

  return (
    <Shell currentPath="/provider">
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <h1 className="text-2xl text-navy">
          {d.dashWelcome}، {user.name} 👋
        </h1>
        {profile?.verified ? (
          <span className="text-xs bg-navy text-gold rounded-full px-3 py-1">✓ {d.verifiedBadge}</span>
        ) : (
          <Link
            href="/provider/verification"
            className="text-xs border border-gold text-navy rounded-full px-3 py-1 hover:bg-gold/10"
          >
            {d.requestVerification}
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-slate text-sm">{d.activeTasks}</div>
          <div className="text-3xl mt-1">{activeTasks.length}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.yourOffer}</div>
          <div className="text-3xl mt-1">{pendingOffers.length}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.availableBalance}</div>
          <div className="text-3xl mt-1">{qar(balances.available, locale)}</div>
        </Card>
        <Card>
          <div className="text-slate text-sm">{d.pendingBalance}</div>
          <div className="text-3xl mt-1">{qar(balances.pending, locale)}</div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl">{d.activeTasks}</h2>
        <Link href="/provider/browse" className={btnPrimary}>
          {d.navBrowseTasks}
        </Link>
      </div>
      {activeTasks.length === 0 ? (
        <Card className="text-center py-10 text-slate">{d.none}</Card>
      ) : (
        <div className="space-y-3">
          {activeTasks.map((offer) => (
            <Link key={offer.id} href={`/provider/tasks/${offer.taskId}`} className="block">
              <Card className="hover:border-gold transition-colors">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <div className="text-navy">{offer.task.title}</div>
                    <div className="text-sm text-slate mt-0.5">
                      {catName(locale, offer.task.category)} · {qar(offer.price, locale)} ·{" "}
                      {fmtDate(offer.task.deadline, locale)}
                    </div>
                  </div>
                  <StatusBadge status={offer.task.status} d={d} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
