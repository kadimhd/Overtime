import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role, TaskStatus } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { submitOffer } from "@/app/actions/tasks";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls } from "@/components/ui";
import Link from "next/link";

export default async function BrowseTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sent?: string }>;
}) {
  const user = await requireUser(Role.PROVIDER);
  const { category: filter, sent } = await searchParams;
  const locale = await getLocale();
  const d = t(locale);

  const [categories, tasks] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.task.findMany({
      where: {
        status: TaskStatus.OPEN,
        ...(filter ? { category: { slug: filter } } : {}),
      },
      include: { category: true, offers: true, client: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <Shell currentPath="/provider/browse">
      <PageTitle>{d.browseTasks}</PageTitle>
      {sent ? (
        <p className="mb-4 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md px-4 py-2">
          ✓ {d.offerSent}
        </p>
      ) : null}

      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/provider/browse"
          className={`text-sm rounded-full px-4 py-1.5 border ${
            !filter ? "bg-navy text-ivory border-navy" : "border-navy/20 hover:border-gold"
          }`}
        >
          {d.all}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/provider/browse?category=${c.slug}`}
            className={`text-sm rounded-full px-4 py-1.5 border ${
              filter === c.slug ? "bg-navy text-ivory border-navy" : "border-navy/20 hover:border-gold"
            }`}
          >
            {catName(locale, c)}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center py-10 text-slate">{d.none}</Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const mine = task.offers.find((offer) => offer.providerId === user.id);
            return (
              <Card key={task.id}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <div className="text-navy">{task.title}</div>
                    <div className="text-sm text-slate mt-0.5">
                      {catName(locale, task.category)} · {task.client.name} ·{" "}
                      {fmtDate(task.deadline, locale)}
                    </div>
                  </div>
                  <div className="text-lg text-navy">{qar(task.budget, locale)}</div>
                </div>
                <p className="text-sm text-slate mt-2 whitespace-pre-wrap">{task.description}</p>
                <details className="mt-3" open={false}>
                  <summary className="cursor-pointer text-sm text-gold">
                    {mine ? `✓ ${d.yourOffer}: ${qar(mine.price, locale)}` : d.submitOffer}
                  </summary>
                  <form action={submitOffer} className="mt-3 grid sm:grid-cols-4 gap-2">
                    <input type="hidden" name="taskId" value={task.id} />
                    <input
                      name="price"
                      type="number"
                      min={1}
                      required
                      defaultValue={mine?.price}
                      placeholder={d.offerPricePh}
                      className={inputCls}
                    />
                    <input
                      name="days"
                      type="number"
                      min={1}
                      required
                      defaultValue={mine?.days}
                      placeholder={d.offerDaysPh}
                      className={inputCls}
                    />
                    <input
                      name="message"
                      defaultValue={mine?.message}
                      placeholder={d.offerMsgPh}
                      className={`${inputCls} sm:col-span-2`}
                    />
                    <button className={`${btnPrimary} sm:col-span-4 justify-self-start`}>
                      {d.submitOffer}
                    </button>
                  </form>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
