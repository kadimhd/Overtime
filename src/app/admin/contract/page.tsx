import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { updateContractTemplate } from "@/app/actions/admin";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default async function AdminContractPage() {
  await requireUser(Role.ADMIN);
  const locale = await getLocale();
  const d = t(locale);
  const template = await db.contractTemplate.findFirst({ where: { active: true } });

  return (
    <Shell currentPath="/admin/contract">
      <PageTitle sub={d.adminContractNote}>{d.adminContract}</PageTitle>
      <Card>
        <p className="text-xs text-slate mb-4 bg-gold/10 border border-gold/30 rounded-md px-3 py-2" dir="ltr">
          Placeholders: {"{{client}} {{provider}} {{task}} {{price}} {{days}} {{date}}"}
        </p>
        <form action={updateContractTemplate} className="space-y-4">
          <div>
            <label className={labelCls}>{d.templateAr}</label>
            <textarea
              name="bodyAr"
              required
              rows={12}
              dir="rtl"
              defaultValue={template?.bodyAr}
              className={`${inputCls} font-mono text-xs`}
            />
          </div>
          <div>
            <label className={labelCls}>{d.templateEn}</label>
            <textarea
              name="bodyEn"
              required
              rows={12}
              dir="ltr"
              defaultValue={template?.bodyEn}
              className={`${inputCls} font-mono text-xs`}
            />
          </div>
          <button className={btnPrimary}>{d.save}</button>
        </form>
      </Card>
    </Shell>
  );
}
