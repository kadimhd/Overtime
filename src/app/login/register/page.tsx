import { getLocale, t } from "@/lib/i18n";
import { Role } from "@/lib/enums";
import { register } from "@/app/actions/auth";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function RegisterPage() {
  const locale = await getLocale();
  const d = t(locale);
  return (
    <Shell currentPath="/login">
      <div className="max-w-md mx-auto mt-8">
        <PageTitle>{d.newAccountRole}</PageTitle>
        <Card>
          <form action={register} className="space-y-4">
            <div>
              <label className={labelCls}>{d.yourName}</label>
              <input name="name" required className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 border border-navy/15 rounded-md px-3 py-3 cursor-pointer has-checked:border-gold has-checked:bg-gold/10">
                <input type="radio" name="role" value={Role.CLIENT} defaultChecked className="accent-[#C9A227]" />
                <span className="text-sm">{d.roleClient}</span>
              </label>
              <label className="flex items-center gap-3 border border-navy/15 rounded-md px-3 py-3 cursor-pointer has-checked:border-gold has-checked:bg-gold/10">
                <input type="radio" name="role" value={Role.PROVIDER} className="accent-[#C9A227]" />
                <span className="text-sm">{d.roleProvider}</span>
              </label>
            </div>
            <button className={btnPrimary}>{d.next}</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
