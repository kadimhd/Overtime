"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role, VerificationStatus } from "@/lib/enums";
import { providerBalances } from "@/lib/payments/escrow";

async function requireProfile() {
  const user = await requireUser(Role.PROVIDER);
  const profile = await db.providerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/");
  return { user, profile };
}

export async function updateProfile(formData: FormData) {
  const { profile } = await requireProfile();
  const rate = parseInt((formData.get("hourlyRate") as string) ?? "", 10);
  await db.providerProfile.update({
    where: { id: profile.id },
    data: {
      headline: ((formData.get("headline") as string) ?? "").trim(),
      bio: ((formData.get("bio") as string) ?? "").trim(),
      skills: ((formData.get("skills") as string) ?? "").trim(),
      portfolio: ((formData.get("portfolio") as string) ?? "").trim(),
      hourlyRate: isNaN(rate) ? null : rate,
    },
  });
  revalidatePath("/provider/profile");
}

export async function updateAvailability(formData: FormData) {
  const { profile } = await requireProfile();
  const hours = parseInt((formData.get("hoursPerWeek") as string) ?? "20", 10);
  const categoryIds = formData.getAll("categoryIds").map(String);
  await db.$transaction([
    db.providerProfile.update({
      where: { id: profile.id },
      data: { hoursPerWeek: isNaN(hours) ? 20 : hours },
    }),
    db.providerCategory.deleteMany({ where: { providerId: profile.id } }),
    db.providerCategory.createMany({
      data: categoryIds.map((categoryId) => ({ providerId: profile.id, categoryId })),
    }),
  ]);
  revalidatePath("/provider/settings");
}

export async function requestVerification(formData: FormData) {
  const { profile } = await requireProfile();
  const documents = ((formData.get("documents") as string) ?? "").trim();
  if (!documents) return;
  await db.verificationRequest.upsert({
    where: { providerId: profile.id },
    create: { providerId: profile.id, documents },
    update: { documents, status: VerificationStatus.PENDING, reviewedAt: null },
  });
  revalidatePath("/provider/verification");
}

export async function requestWithdrawal() {
  const { user } = await requireProfile();
  const { available } = await providerBalances(user.id);
  if (available <= 0) return;
  await db.withdrawal.create({ data: { providerId: user.id, amount: available } });
  revalidatePath("/provider/earnings");
}
