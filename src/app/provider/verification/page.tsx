import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role, VerificationStatus } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { requestVerification } from "@/app/actions/provider";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function VerificationPage() {
  const user = await requireUser(Role.PROVIDER);
  const locale = await getLocale();
  const d = t(locale);
  const profile = await db.providerProfile.findUnique({
    where: { userId: user.id },
    include: { verification: true },
  });
  if (!profile) return null;
  const request = profile.verification;

  return (
    <Shell currentPath="/provider/verification">
      <div className="max-w-xl mx-auto">
        <PageTitle sub={d.verificationSub}>{d.verificationTitle}</PageTitle>
        {profile.verified ? (
          <Card className="border-gold text-center py-8">
            <div className="text-3xl mb-2">🏅</div>
            {d.verificationApproved}
          </Card>
        ) : request?.status === VerificationStatus.PENDING ? (
          <Card className="text-center py-8">
            <div className="text-3xl mb-2">⏳</div>
            {d.verificationPending}
          </Card>
        ) : (
          <Card>
            {request?.status === VerificationStatus.REJECTED ? (
              <p className="text-sm text-red-700 mb-3">{d.verificationRejected}</p>
            ) : null}
            <form action={requestVerification} className="space-y-4">
              <div>
                <label className={labelCls}>{d.verificationDocs}</label>
                <textarea
                  name="documents"
                  required
                  rows={4}
                  placeholder={"QID.pdf\nCertificate.pdf"}
                  className={inputCls}
                />
              </div>
              <button className={btnPrimary}>{d.requestVerification}</button>
            </form>
          </Card>
        )}
      </div>
    </Shell>
  );
}
