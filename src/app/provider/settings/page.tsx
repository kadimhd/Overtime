import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { updateAvailability } from "@/app/actions/provider";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function ProviderSettingsPage() {
  const user = await requireUser(Role.PROVIDER);
  const locale = await getLocale();
  const d = t(locale);

  const [profile, categories] = await Promise.all([
    db.providerProfile.findUnique({
      where: { userId: user.id },
      include: { categories: true },
    }),
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!profile) return null;
  const mine = new Set(profile.categories.map((pc) => pc.categoryId));

  return (
    <Shell currentPath="/provider/settings">
      <div className="max-w-xl mx-auto">
        <PageTitle>{d.settingsTitle}</PageTitle>
        <Card>
          <form action={updateAvailability} className="space-y-5">
            <div>
              <label className={labelCls}>{d.hoursPerWeek}</label>
              <input
                name="hoursPerWeek"
                type="number"
                min={1}
                max={60}
                defaultValue={profile.hoursPerWeek}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{d.myCategories}</label>
              <div className="space-y-2">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 border border-navy/15 rounded-md px-3 py-2.5 cursor-pointer has-checked:border-gold has-checked:bg-gold/10"
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={c.id}
                      defaultChecked={mine.has(c.id)}
                      className="accent-[#C9A227]"
                    />
                    <span className="text-sm">{catName(locale, c)}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className={btnPrimary}>{d.save}</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
