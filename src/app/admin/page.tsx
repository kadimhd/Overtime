import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role, VerificationStatus } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { decideVerification } from "@/app/actions/admin";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnDanger, btnPrimary } from "@/components/ui";

export default async function AdminUsersPage() {
  await requireUser(Role.ADMIN);
  const locale = await getLocale();
  const d = t(locale);

  const [pending, users] = await Promise.all([
    db.verificationRequest.findMany({
      where: { status: VerificationStatus.PENDING },
      include: { provider: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.user.findMany({
      include: { providerProfile: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <Shell currentPath="/admin">
      <PageTitle>{d.adminUsers}</PageTitle>

      {pending.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-xl mb-4">{d.requestVerification}</h2>
          <div className="space-y-3">
            {pending.map((request) => (
              <Card key={request.id}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <div className="text-navy">{request.provider.user.name}</div>
                    <div className="text-sm text-slate">{request.provider.headline}</div>
                    <pre className="text-xs text-slate mt-2 whitespace-pre-wrap" dir="ltr">
                      {request.documents}
                    </pre>
                  </div>
                  <form action={decideVerification} className="flex gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <button name="decision" value="approve" className={btnPrimary}>
                      {d.adminApprove}
                    </button>
                    <button name="decision" value="reject" className={btnDanger}>
                      {d.adminReject}
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate border-b border-navy/10">
              <th className="text-start px-5 py-3">{d.yourName}</th>
              <th className="text-start px-5 py-3">{d.phoneOrEmail}</th>
              <th className="text-start px-5 py-3">{d.status}</th>
              <th className="text-start px-5 py-3">{d.payDate}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-navy/5">
                <td className="px-5 py-3">
                  {user.name}
                  {user.providerProfile?.verified ? (
                    <span className="text-gold ms-1">✓</span>
                  ) : null}
                </td>
                <td className="px-5 py-3" dir="ltr">
                  {user.phone ?? user.email}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs border border-navy/20 rounded-full px-2.5 py-0.5">
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3">{fmtDate(user.createdAt, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Shell>
  );
}
