import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role, SubscriptionStatus } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { cancelSubscription, subscribe } from "@/app/actions/subscriptions";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnDanger, btnPrimary } from "@/components/ui";

export default async function RetainersPage() {
  const user = await requireUser(Role.CLIENT);
  const locale = await getLocale();
  const d = t(locale);

  const [packages, subscription] = await Promise.all([
    db.package.findMany({ where: { active: true }, orderBy: { priceMonthly: "asc" } }),
    db.subscription.findFirst({
      where: { clientId: user.id, status: SubscriptionStatus.ACTIVE },
      include: { package: true },
    }),
  ]);
  const provider = subscription?.providerId
    ? await db.user.findUnique({ where: { id: subscription.providerId } })
    : null;

  return (
    <Shell currentPath="/retainers">
      <PageTitle sub={d.retainersSub}>{d.retainersTitle}</PageTitle>

      {subscription ? (
        <Card className="mb-8 border-gold">
          <h3 className="mb-3">{d.yourSubscription}</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <div className="text-slate text-sm">{d.dashCurrentPackage}</div>
              <div className="text-lg">
                {locale === "ar" ? subscription.package.nameAr : subscription.package.nameEn}
              </div>
            </div>
            <div>
              <div className="text-slate text-sm">{d.hoursUsed}</div>
              <div className="text-lg">
                {subscription.hoursUsed}/{subscription.package.hoursPerMonth} {d.hours}
              </div>
              <div className="h-2 bg-ivory rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-gold"
                  style={{
                    width: `${Math.min(
                      100,
                      (subscription.hoursUsed / subscription.package.hoursPerMonth) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="text-slate text-sm">{d.renewsOn}</div>
              <div className="text-lg">{fmtDate(subscription.renewsAt, locale)}</div>
            </div>
            <div>
              <div className="text-slate text-sm">{d.matchedProvider}</div>
              <div className="text-lg">{provider?.name ?? d.notMatchedYet}</div>
            </div>
          </div>
          <form action={cancelSubscription} className="mt-4">
            <input type="hidden" name="subscriptionId" value={subscription.id} />
            <button className={btnDanger}>{d.cancelSub}</button>
          </form>
        </Card>
      ) : null}

      <div className="grid sm:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const isCurrent = subscription?.packageId === pkg.id;
          return (
            <Card key={pkg.id} className={`flex flex-col ${isCurrent ? "border-gold" : ""}`}>
              <div className="text-xs text-gold uppercase tracking-wide">
                {d[`tier${pkg.tier}` as "tierBASIC"] ?? pkg.tier}
              </div>
              <h3 className="mt-1">{locale === "ar" ? pkg.nameAr : pkg.nameEn}</h3>
              <p className="text-slate text-sm mt-1 flex-1">
                {locale === "ar" ? pkg.descAr : pkg.descEn}
              </p>
              <div className="mt-4 text-xl text-navy">
                {qar(pkg.priceMonthly, locale)}
                <span className="text-sm text-slate"> {d.perMonth}</span>
              </div>
              <div className="text-sm text-slate mb-4">
                {pkg.hoursPerMonth} {d.hours}
              </div>
              {isCurrent ? (
                <span className="text-sm text-gold">✓ {d.yourSubscription}</span>
              ) : (
                <form action={subscribe}>
                  <input type="hidden" name="packageId" value={pkg.id} />
                  <button className={`${btnPrimary} w-full`}>
                    {subscription ? d.changePackage : d.subscribe}
                  </button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
