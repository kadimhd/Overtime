import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { catDesc, catName, getLocale, t } from "@/lib/i18n";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary } from "@/components/ui";

// Onboarding answer → suggested launch category (spec §5-أ step 3).
const sinkToCategory: Record<string, string> = {
  accounting: "accounting",
  admin: "virtual-assistance",
  marketing: "marketing",
};

export default async function OnboardingDonePage() {
  const user = await requireUser(Role.CLIENT);
  const locale = await getLocale();
  const d = t(locale);
  const slug = sinkToCategory[user.timeSink ?? ""] ?? "accounting";
  const category = await db.category.findUnique({ where: { slug } });

  return (
    <Shell currentPath="/onboarding">
      <div className="max-w-xl mx-auto mt-4">
        <PageTitle sub={d.onboardingSuggestion}>{d.onboardingDone}</PageTitle>
        {category ? (
          <Card>
            <h3 className="text-lg text-gold">{catName(locale, category)}</h3>
            <p className="text-slate text-sm mt-1">{catDesc(locale, category)}</p>
            <div className="mt-5 flex gap-3">
              <Link href={`/tasks/new?category=${category.slug}`} className={btnPrimary}>
                {d.navPostTask}
              </Link>
              <Link href="/dashboard" className="text-sm text-slate self-center hover:text-gold">
                {d.goDashboard}
              </Link>
            </div>
          </Card>
        ) : (
          <Link href="/dashboard" className={btnPrimary}>
            {d.goDashboard}
          </Link>
        )}
      </div>
    </Shell>
  );
}
