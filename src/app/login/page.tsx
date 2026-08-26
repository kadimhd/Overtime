import { getLocale, t } from "@/lib/i18n";
import { requestOtp } from "@/app/actions/auth";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function LoginPage() {
  const locale = await getLocale();
  const d = t(locale);
  return (
    <Shell currentPath="/login">
      <div className="max-w-md mx-auto mt-8">
        <PageTitle sub={d.loginSub}>{d.loginTitle}</PageTitle>
        <Card>
          <form action={requestOtp} className="space-y-4">
            <div>
              <label className={labelCls}>{d.phoneOrEmail}</label>
              <input
                name="target"
                required
                dir="ltr"
                placeholder={d.phonePlaceholder}
                className={inputCls}
              />
            </div>
            <button className={btnPrimary}>{d.sendOtp}</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
