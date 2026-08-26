import { requireUser } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { getLocale, t } from "@/lib/i18n";
import { completeOnboarding } from "@/app/actions/auth";
import { Shell } from "@/components/Shell";
import { Card, PageTitle, btnPrimary } from "@/components/ui";

function OptionGroup({
  name,
  options,
}: {
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt, i) => (
        <label
          key={opt.value}
          className="border border-navy/15 rounded-full px-4 py-2 text-sm cursor-pointer has-checked:border-gold has-checked:bg-gold/15"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            defaultChecked={i === 0}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default async function OnboardingPage() {
  await requireUser(Role.CLIENT);
  const locale = await getLocale();
  const d = t(locale);
  return (
    <Shell currentPath="/onboarding">
      <div className="max-w-xl mx-auto mt-4">
        <PageTitle sub={d.onboardingSub}>{d.onboardingTitle}</PageTitle>
        <Card>
          <form action={completeOnboarding} className="space-y-6">
            <div>
              <h3 className="mb-2">{d.qBusinessType}</h3>
              <OptionGroup
                name="businessType"
                options={[
                  { value: "ecommerce", label: d.bizEcommerce },
                  { value: "startup", label: d.bizStartup },
                  { value: "freelance", label: d.bizFreelance },
                  { value: "qfz", label: d.bizQfz },
                  { value: "other", label: d.bizOther },
                ]}
              />
            </div>
            <div>
              <h3 className="mb-2">{d.qTeamSize}</h3>
              <OptionGroup
                name="teamSize"
                options={[
                  { value: "just_me", label: d.teamJustMe },
                  { value: "small", label: d.teamSmall },
                  { value: "more", label: d.teamMore },
                ]}
              />
            </div>
            <div>
              <h3 className="mb-2">{d.qTimeSink}</h3>
              <OptionGroup
                name="timeSink"
                options={[
                  { value: "accounting", label: d.sinkAccounting },
                  { value: "admin", label: d.sinkAdmin },
                  { value: "marketing", label: d.sinkMarketing },
                ]}
              />
            </div>
            <button className={btnPrimary}>{d.next}</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
