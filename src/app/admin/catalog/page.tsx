import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { qar } from "@/lib/format";
import { addCategory, addPackage, toggleCategory, togglePackage } from "@/app/actions/admin";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

export default async function AdminCatalogPage() {
  await requireUser(Role.ADMIN);
  const locale = await getLocale();
  const d = t(locale);

  const [categories, packages] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.package.findMany({ orderBy: { priceMonthly: "asc" } }),
  ]);

  return (
    <Shell currentPath="/admin/catalog">
      <PageTitle>{d.adminCatalog}</PageTitle>
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl mb-4">{d.taskCategory}</h2>
          <div className="space-y-2 mb-4">
            {categories.map((c) => (
              <Card key={c.id} className={`py-3 ${c.active ? "" : "opacity-50"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-navy">{catName(locale, c)}</span>
                    <span className="text-xs text-slate ms-2" dir="ltr">
                      /{c.slug}
                    </span>
                  </div>
                  <form action={toggleCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className={btnSecondary}>{c.active ? "⏸" : "▶"}</button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <h3 className="mb-3">{d.addCategory}</h3>
            <form action={addCategory} className="grid grid-cols-2 gap-2">
              <input name="nameAr" required placeholder={d.nameArLabel} className={inputCls} />
              <input name="nameEn" required placeholder={d.nameEnLabel} dir="ltr" className={inputCls} />
              <button className={`${btnPrimary} col-span-2 justify-self-start`}>{d.addCategory}</button>
            </form>
          </Card>
        </section>

        <section>
          <h2 className="text-xl mb-4">{d.navRetainers}</h2>
          <div className="space-y-2 mb-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`py-3 ${pkg.active ? "" : "opacity-50"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-navy">{locale === "ar" ? pkg.nameAr : pkg.nameEn}</span>
                    <span className="text-xs text-slate ms-2">
                      {pkg.hoursPerMonth} {d.hours} · {qar(pkg.priceMonthly, locale)} {d.perMonth}
                    </span>
                  </div>
                  <form action={togglePackage}>
                    <input type="hidden" name="id" value={pkg.id} />
                    <button className={btnSecondary}>{pkg.active ? "⏸" : "▶"}</button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <h3 className="mb-3">{d.addPackage}</h3>
            <form action={addPackage} className="grid grid-cols-2 gap-2">
              <input name="nameAr" required placeholder={d.nameArLabel} className={inputCls} />
              <input name="nameEn" required placeholder={d.nameEnLabel} dir="ltr" className={inputCls} />
              <input
                name="hoursPerMonth"
                type="number"
                min={1}
                required
                placeholder={`${d.hours}/شهر`}
                className={inputCls}
              />
              <input
                name="priceMonthly"
                type="number"
                min={1}
                required
                placeholder={d.taskBudget}
                className={inputCls}
              />
              <select name="tier" className={inputCls} defaultValue="BASIC">
                <option value="BASIC">{d.tierBASIC}</option>
                <option value="GROWTH">{d.tierGROWTH}</option>
                <option value="FULL">{d.tierFULL}</option>
              </select>
              <select name="categoryId" className={inputCls} defaultValue="none">
                <option value="none">{d.none}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {catName(locale, c)}
                  </option>
                ))}
              </select>
              <button className={`${btnPrimary} col-span-2 justify-self-start`}>{d.addPackage}</button>
            </form>
          </Card>
        </section>
      </div>
    </Shell>
  );
}
