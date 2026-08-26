import { getLocale, t } from "@/lib/i18n";
import { DEMO_OTP } from "@/lib/auth";
import { verifyOtp } from "@/app/actions/auth";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls } from "@/components/ui";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; error?: string }>;
}) {
  const { target = "", error } = await searchParams;
  const locale = await getLocale();
  const d = t(locale);
  return (
    <Shell currentPath="/login">
      <div className="max-w-md mx-auto mt-8">
        <PageTitle sub={`${d.otpSent} ${target}`}>{d.otpTitle}</PageTitle>
        <Card>
          {error ? <p className="text-red-700 text-sm mb-3">{d.invalidOtp}</p> : null}
          <p className="text-sm text-slate mb-4 bg-gold/10 border border-gold/30 rounded-md px-3 py-2">
            {d.otpDemoHint} <code dir="ltr">{DEMO_OTP}</code>
          </p>
          <form action={verifyOtp} className="space-y-4">
            <input type="hidden" name="target" value={target} />
            <input
              name="code"
              required
              dir="ltr"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              className={`${inputCls} text-center text-2xl tracking-[0.5em]`}
            />
            <button className={btnPrimary}>{d.verify}</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
