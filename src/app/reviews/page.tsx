import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { Shell } from "@/components/Shell";
import { Card, PageTitle } from "@/components/ui";

export default async function ReviewsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const d = t(locale);

  const reviews = await db.review.findMany({
    where: { OR: [{ reviewerId: user.id }, { revieweeId: user.id }] },
    include: { reviewer: true, reviewee: true, task: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell currentPath="/reviews">
      <PageTitle>{d.reviewsTitle}</PageTitle>
      {reviews.length === 0 ? (
        <Card className="text-center py-10 text-slate">{d.noReviews}</Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gold">
                  {"★".repeat(review.rating)}
                  <span className="text-navy/20">{"★".repeat(5 - review.rating)}</span>
                </span>
                <span className="text-sm text-navy">
                  {review.reviewer.name} → {review.reviewee.name}
                </span>
                <span className="ms-auto text-xs text-slate">
                  {fmtDate(review.createdAt, locale)}
                </span>
              </div>
              <div className="text-sm text-slate mt-1">{review.task.title}</div>
              {review.comment ? <p className="text-sm mt-2">{review.comment}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
