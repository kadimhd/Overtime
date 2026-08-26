"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  checkOtp,
  createSession,
  isEmail,
  issueOtp,
  normalizeTarget,
  requireUser,
} from "@/lib/auth";
import { Role } from "@/lib/enums";

const PENDING_COOKIE = "ot_pending_target";

async function homeFor(role: string, needsOnboarding: boolean): Promise<never> {
  if (role === Role.ADMIN) redirect("/admin");
  if (role === Role.PROVIDER) redirect("/provider");
  redirect(needsOnboarding ? "/onboarding" : "/dashboard");
}

export async function requestOtp(formData: FormData) {
  const raw = (formData.get("target") as string) ?? "";
  if (!raw.trim()) redirect("/login");
  const target = normalizeTarget(raw);
  await issueOtp(target);
  redirect(`/login/verify?target=${encodeURIComponent(target)}`);
}

export async function verifyOtp(formData: FormData) {
  const target = (formData.get("target") as string) ?? "";
  const code = ((formData.get("code") as string) ?? "").trim();
  const ok = await checkOtp(target, code);
  if (!ok) redirect(`/login/verify?target=${encodeURIComponent(target)}&error=1`);

  const user = await db.user.findFirst({
    where: isEmail(target) ? { email: target } : { phone: target },
  });
  if (user) {
    await createSession(user.id);
    await homeFor(user.role, !user.businessType);
  }
  const store = await cookies();
  store.set(PENDING_COOKIE, target, { httpOnly: true, maxAge: 15 * 60, path: "/" });
  redirect("/login/register");
}

export async function register(formData: FormData) {
  const store = await cookies();
  const target = store.get(PENDING_COOKIE)?.value;
  if (!target) redirect("/login");

  const name = ((formData.get("name") as string) ?? "").trim();
  const role = formData.get("role") === Role.PROVIDER ? Role.PROVIDER : Role.CLIENT;
  if (!name) redirect("/login/register?error=1");

  const user = await db.user.create({
    data: {
      name,
      role,
      ...(isEmail(target) ? { email: target } : { phone: target }),
      ...(role === Role.PROVIDER ? { providerProfile: { create: {} } } : {}),
    },
  });
  store.delete(PENDING_COOKIE);
  await createSession(user.id);
  if (role === Role.PROVIDER) redirect("/provider/profile");
  redirect("/onboarding");
}

export async function completeOnboarding(formData: FormData) {
  const user = await requireUser(Role.CLIENT);
  await db.user.update({
    where: { id: user.id },
    data: {
      businessType: (formData.get("businessType") as string) ?? null,
      teamSize: (formData.get("teamSize") as string) ?? null,
      timeSink: (formData.get("timeSink") as string) ?? null,
    },
  });
  redirect("/onboarding/done");
}
