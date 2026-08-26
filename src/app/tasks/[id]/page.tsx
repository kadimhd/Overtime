import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OfferStatus, Role, TaskStatus } from "@/lib/enums";
import { catName, getLocale, t } from "@/lib/i18n";
import { fmtDate, qar } from "@/lib/format";
import { acceptOffer, approveDelivery, leaveReview, openDispute } from "@/app/actions/tasks";
import { Shell } from "@/components/Shell";
import { TaskChat } from "@/components/TaskChat";
import { Card, StatusBadge, btnDanger, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(Role.CLIENT);
  const locale = await getLocale();
  const d = t(locale);

  const task = await db.task.findUnique({
    where: { id },
    include: {
      category: true,
      offers: {
        include: { provider: { include: { providerProfile: true, reviewsReceived: true } } },
        orderBy: { price: "asc" },
      },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      contract: true,
      reviews: true,
      dispute: true,
    },
  });
  if (!task || task.clientId !== user.id) notFound();

  const accepted = task.offers.find((offer) => offer.status === OfferStatus.ACCEPTED);
  const myReview = task.reviews.find((review) => review.reviewerId === user.id);
  const chatOpen =
    task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.DELIVERED;

  return (
    <Shell currentPath={`/tasks/${task.id}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl text-navy">{task.title}</h1>
          <p className="text-slate mt-1">
            {catName(locale, task.category)} · {qar(task.budget, locale)} ·{" "}
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

          {/* Offers comparison — only while the task is open (spec §5-ب step 3) */}
          {task.status === TaskStatus.OPEN ? (
            <Card>
              <h3 className="mb-4">{d.offersReceived}</h3>
              {task.offers.length === 0 ? (
                <p className="text-sm text-slate">{d.noOffersYet}</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate bg-gold/10 border border-gold/30 rounded-md px-3 py-2">
                    {d.escrowNote}
                  </p>
                  {task.offers
                    .filter((offer) => offer.status === OfferStatus.PENDING)
                    .map((offer) => {
                      const reviews = offer.provider.reviewsReceived;
                      const avg =
                        reviews.length > 0
                          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                          : null;
                      return (
                        <div key={offer.id} className="border border-navy/10 rounded-lg p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-navy">{offer.provider.name}</span>
                            {offer.provider.providerProfile?.verified ? (
                              <span className="text-xs bg-navy text-gold rounded-full px-2 py-0.5">
                                ✓ {d.verifiedBadge}
                              </span>
                            ) : null}
                            {avg ? <span className="text-xs text-slate">★ {avg}</span> : null}
                            <span className="ms-auto text-lg text-navy">{qar(offer.price, locale)}</span>
                          </div>
                          <div className="text-sm text-slate mt-1">
                            {offer.provider.providerProfile?.headline}
                          </div>
                          <div className="text-sm text-slate mt-2">
                            {d.offerDuration}: {offer.days} {d.days}
                          </div>
                          {offer.message ? (
                            <p className="text-sm mt-2 bg-ivory rounded-md px-3 py-2">{offer.message}</p>
                          ) : null}
                          <form action={acceptOffer} className="mt-3">
                            <input type="hidden" name="offerId" value={offer.id} />
                            <button className={btnPrimary}>{d.acceptOffer}</button>
                          </form>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          ) : null}

          {accepted ? (
            <TaskChat
              taskId={task.id}
              messages={task.messages}
              currentUserId={user.id}
              d={d}
              locale={locale}
              canPost={chatOpen}
            />
          ) : null}

          {/* Review after completion */}
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
          {accepted ? (
            <Card>
              <h3 className="mb-2">{d.offerBy}</h3>
              <div className="text-navy">{accepted.provider.name}</div>
              <div className="text-sm text-slate">{accepted.provider.providerProfile?.headline}</div>
              <div className="mt-3 text-sm">
                {d.offerPrice}: <span className="text-navy">{qar(accepted.price, locale)}</span>
              </div>
              <div className="text-sm">
                {d.offerDuration}: {accepted.days} {d.days}
              </div>
            </Card>
          ) : null}

          {task.status === TaskStatus.DELIVERED ? (
            <Card className="border-gold">
              <p className="text-sm text-slate mb-3">{d.escrowNote}</p>
              <form action={approveDelivery}>
                <input type="hidden" name="taskId" value={task.id} />
                <button className={`${btnPrimary} w-full`}>{d.approveDelivery}</button>
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
