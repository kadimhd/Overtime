import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { updateProfile } from "@/app/actions/provider";
import { Shell } from "@/components/Shell";
import { Card, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function ProviderProfilePage() {
  const user = await requireUser(Role.PROVIDER);
  const locale = await getLocale();
  const d = t(locale);
  const profile = await db.providerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return null;

  return (
    <Shell currentPath="/provider/profile">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <h1 className="text-2xl text-navy">{d.provProfile}</h1>
          {profile.verified ? (
            <span className="text-xs bg-navy text-gold rounded-full px-3 py-1">
              ✓ {d.verifiedBadge}
            </span>
          ) : (
            <Link
              href="/provider/verification"
              className="text-xs border border-gold rounded-full px-3 py-1 hover:bg-gold/10"
            >
              {d.requestVerification}
            </Link>
          )}
          <Link
            href="/provider/settings"
            className="ms-auto text-sm text-slate hover:text-gold"
          >
            {d.settingsTitle} ←
          </Link>
        </div>
        <Card>
          <form action={updateProfile} className="space-y-4">
            <div>
              <label className={labelCls}>{d.headline}</label>
              <input
                name="headline"
                defaultValue={profile.headline}
                placeholder={d.headlinePh}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{d.bio}</label>
              <textarea name="bio" rows={4} defaultValue={profile.bio} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{d.skills}</label>
              <input name="skills" defaultValue={profile.skills} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>
                {d.hourlyRate} ({d.optional})
              </label>
              <input
                name="hourlyRate"
                type="number"
                min={0}
                defaultValue={profile.hourlyRate ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{d.portfolio}</label>
              <textarea
                name="portfolio"
                rows={3}
                dir="ltr"
                defaultValue={profile.portfolio}
                className={inputCls}
              />
            </div>
            <button className={btnPrimary}>{d.save}</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
