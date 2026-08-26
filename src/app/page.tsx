import Link from "next/link";
import { db } from "@/lib/db";
import { catDesc, catName, getLocale, t } from "@/lib/i18n";
import { qar } from "@/lib/format";
import { Shell } from "@/components/Shell";
import { LogoMark } from "@/components/Logo";
import { Card } from "@/components/ui";

export default async function LandingPage() {
  const locale = await getLocale();
  const d = t(locale);
  const [categories, packages] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.package.findMany({ where: { active: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  return (
    <Shell currentPath="/">
      {/* Hero */}
      <section className="bg-navy text-ivory rounded-2xl px-8 py-14 -mt-2">
        <div className="max-w-2xl">
          <div className="text-gold mb-4">
            <LogoMark size={44} />
          </div>
          <h1 className="text-4xl leading-tight">{d.landingHeroTitle}</h1>
          <p className="mt-4 text-ivory/80 text-lg leading-relaxed">{d.landingHeroSub}</p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/login" className="bg-gold text-navy rounded-md px-6 py-3 hover:bg-gold-soft">
              {d.landingCtaClient}
            </Link>
            <Link
              href="/login"
              className="border border-ivory/40 rounded-md px-6 py-3 hover:border-gold hover:text-gold"
            >
              {d.landingCtaProvider}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12">
        <h2 className="text-2xl mb-6">{d.landingHow}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            [d.landingStep1Title, d.landingStep1Body],
            [d.landingStep2Title, d.landingStep2Body],
            [d.landingStep3Title, d.landingStep3Body],
          ].map(([title, body], i) => (
            <Card key={title}>
              <div className="w-8 h-8 rounded-full bg-gold/20 text-navy flex items-center justify-center mb-3">
                {i + 1}
              </div>
              <h3>{title}</h3>
              <p className="text-slate text-sm mt-1">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Launch categories */}
      <section className="mt-12">
        <h2 className="text-2xl mb-6">{d.landingCats}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Card key={c.id}>
              <h3>{catName(locale, c)}</h3>
              <p className="text-slate text-sm mt-1">{catDesc(locale, c)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Retainers */}
      <section className="mt-12">
        <h2 className="text-2xl mb-2">{d.landingRetainersTitle}</h2>
        <p className="text-slate mb-6 max-w-2xl">{d.landingRetainersBody}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {packages.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="text-xs text-gold uppercase tracking-wide">
                {d[`tier${p.tier}` as "tierBASIC"] ?? p.tier}
              </div>
              <h3 className="mt-1">{locale === "ar" ? p.nameAr : p.nameEn}</h3>
              <p className="text-slate text-sm mt-1 flex-1">
                {locale === "ar" ? p.descAr : p.descEn}
              </p>
              <div className="mt-4 text-navy text-xl">
                {qar(p.priceMonthly, locale)}
                <span className="text-sm text-slate"> {d.perMonth}</span>
              </div>
              <div className="text-sm text-slate">
                {p.hoursPerMonth} {d.hours}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="mt-12 bg-ivory rounded-xl border border-gold/30 p-6 text-sm text-slate">
        {d.landingCompliance}
      </section>
    </Shell>
  );
}
