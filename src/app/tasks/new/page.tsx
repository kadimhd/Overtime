import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { postTask } from "@/app/actions/tasks";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireUser(Role.CLIENT);
  const { category: preselect } = await searchParams;
  const locale = await getLocale();
  const d = t(locale);
  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <Shell currentPath="/tasks/new">
      <div className="max-w-xl mx-auto">
        <PageTitle>{d.postTaskTitle}</PageTitle>
        <Card>
          <form action={postTask} className="space-y-4">
            <div>
              <label className={labelCls}>{d.taskCategory}</label>
              <select
                name="categoryId"
                required
                className={inputCls}
                defaultValue={categories.find((c) => c.slug === preselect)?.id ?? categories[0]?.id}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {catName(locale, c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{d.taskTitleLabel}</label>
              <input name="title" required placeholder={d.taskTitlePh} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{d.taskDesc}</label>
              <textarea
                name="description"
                required
                rows={5}
                placeholder={d.taskDescPh}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{d.taskBudget}</label>
                <input name="budget" type="number" min={50} required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{d.taskDeadline}</label>
                <input name="deadline" type="date" required className={inputCls} />
              </div>
            </div>
            <button className={btnPrimary}>{d.publishTask}</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
