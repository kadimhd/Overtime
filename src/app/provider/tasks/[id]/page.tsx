import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OfferStatus, Role, TaskStatus } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { leaveReview, markDelivered, openDispute } from "@/app/actions/tasks";
import { Shell } from "@/components/Shell";
import { TaskChat } from "@/components/TaskChat";
import { Card, StatusBadge, btnDanger, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function ProviderTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(Role.PROVIDER);
  const locale = await getLocale();
  const d = t(locale);

  const task = await db.task.findUnique({
    where: { id },
    include: {
      category: true,
      client: true,
      offers: { where: { status: OfferStatus.ACCEPTED } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      contract: true,
      reviews: true,
      dispute: true,
    },
  });
  const myOffer = task?.offers.find((offer) => offer.providerId === user.id);
  if (!task || !myOffer) notFound();

  const myReview = task.reviews.find((review) => review.reviewerId === user.id);
  const chatOpen =
    task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.DELIVERED;

  return (
    <Shell currentPath={`/provider/tasks/${task.id}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl text-navy">{task.title}</h1>
          <p className="text-slate mt-1">
            {catName(locale, task.category)} · {task.client.name} · {qar(myOffer.price, locale)} ·{" "}
            {fmtDate(task.deadline, locale)}
          </p>
        </div>
        <StatusBadge status={task.status} d={d} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="mb-2">{d.taskDetails}</h3>
            <p className="text-sm text-slate whitespace-pre-wrap">{task.description}</p>
          </Card>
          <TaskChat
            taskId={task.id}
            messages={task.messages}
            currentUserId={user.id}
            d={d}
            locale={locale}
            canPost={chatOpen}
          />
          {task.status === TaskStatus.COMPLETED && !myReview ? (
            <Card>
              <h3 className="mb-3">{d.leaveReview}</h3>
              <form action={leaveReview} className="space-y-3">
                <input type="hidden" name="taskId" value={task.id} />
                <div>
                  <label className={labelCls}>{d.rating}</label>
                  <select name="rating" className={inputCls} defaultValue="5">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {"★".repeat(n)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{d.reviewComment}</label>
                  <textarea name="comment" rows={2} className={inputCls} />
                </div>
                <button className={btnPrimary}>{d.submit}</button>
              </form>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {task.status === TaskStatus.IN_PROGRESS ? (
            <Card className="border-gold">
              <p className="text-sm text-slate mb-3">{d.escrowNote}</p>
              <form action={markDelivered}>
                <input type="hidden" name="taskId" value={task.id} />
                <button className={`${btnPrimary} w-full`}>{d.markDelivered}</button>
              </form>
            </Card>
          ) : null}

          {chatOpen && !task.dispute ? (
            <Card>
              <h3 className="mb-2">{d.openDispute}</h3>
              <form action={openDispute} className="space-y-2">
                <input type="hidden" name="taskId" value={task.id} />
                <textarea
                  name="reason"
                  required
                  rows={2}
                  placeholder={d.disputeReason}
                  className={inputCls}
                />
                <button className={btnDanger}>{d.openDispute}</button>
              </form>
            </Card>
          ) : null}

          {task.dispute ? (
            <Card className="border-red-200">
              <h3 className="mb-1">{d.openDispute}</h3>
              <StatusBadge status={task.dispute.status} d={d} />
              <p className="text-sm text-slate mt-2">{task.dispute.reason}</p>
            </Card>
          ) : null}

          {task.contract ? (
            <details className="bg-white rounded-xl border border-navy/10 shadow-sm p-5">
              <summary className="cursor-pointer">{d.contractView}</summary>
              <pre className="text-xs text-slate whitespace-pre-wrap mt-3 max-h-72 overflow-y-auto">
                {task.contract.body}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
