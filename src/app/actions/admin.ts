"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DisputeStatus, Role, TaskStatus, VerificationStatus } from "@/lib/enums";
import { refundTaskEscrow, releaseTaskEscrow } from "@/lib/payments/escrow";

export async function decideVerification(formData: FormData) {
  await requireUser(Role.ADMIN);
  const id = formData.get("requestId") as string;
  const approve = formData.get("decision") === "approve";
  const request = await db.verificationRequest.findUnique({ where: { id } });
  if (!request || request.status !== VerificationStatus.PENDING) return;
  await db.$transaction([
    db.verificationRequest.update({
      where: { id },
      data: {
        status: approve ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
        reviewedAt: new Date(),
      },
    }),
    db.providerProfile.update({
      where: { id: request.providerId },
      data: { verified: approve },
    }),
  ]);
  revalidatePath("/admin");
}

/** Dispute resolution moves the escrow: release to provider or refund to client. */
export async function resolveDispute(formData: FormData) {
  await requireUser(Role.ADMIN);
  const id = formData.get("disputeId") as string;
  const release = formData.get("decision") === "release";
  const note = ((formData.get("note") as string) ?? "").trim();
  const dispute = await db.dispute.findUnique({ where: { id } });
  if (!dispute || dispute.status !== DisputeStatus.OPEN) return;

  if (release) await releaseTaskEscrow(dispute.taskId);
  else await refundTaskEscrow(dispute.taskId);

  await db.$transaction([
    db.dispute.update({
      where: { id },
      data: {
        status: release ? DisputeStatus.RESOLVED_RELEASE : DisputeStatus.RESOLVED_REFUND,
        adminNote: note,
        resolvedAt: new Date(),
      },
    }),
    db.task.update({
      where: { id: dispute.taskId },
      data: {
        status: release ? TaskStatus.COMPLETED : TaskStatus.CANCELLED,
        completedAt: release ? new Date() : null,
      },
    }),
  ]);
  revalidatePath("/admin/disputes");
}

export async function addCategory(formData: FormData) {
  await requireUser(Role.ADMIN);
  const nameAr = ((formData.get("nameAr") as string) ?? "").trim();
  const nameEn = ((formData.get("nameEn") as string) ?? "").trim();
  if (!nameAr || !nameEn) return;
  const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const count = await db.category.count();
  await db.category.create({
    data: { slug: slug || `category-${count + 1}`, nameAr, nameEn, sortOrder: count },
  });
  revalidatePath("/admin/catalog");
}

export async function toggleCategory(formData: FormData) {
  await requireUser(Role.ADMIN);
  const id = formData.get("id") as string;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) return;
  await db.category.update({ where: { id }, data: { active: !category.active } });
  revalidatePath("/admin/catalog");
}

export async function addPackage(formData: FormData) {
  await requireUser(Role.ADMIN);
  const nameAr = ((formData.get("nameAr") as string) ?? "").trim();
  const nameEn = ((formData.get("nameEn") as string) ?? "").trim();
  const hours = parseInt((formData.get("hoursPerMonth") as string) ?? "0", 10);
  const price = parseInt((formData.get("priceMonthly") as string) ?? "0", 10);
  const tier = (formData.get("tier") as string) || "BASIC";
  const categoryId = (formData.get("categoryId") as string) || null;
  if (!nameAr || !nameEn || !hours || !price) return;
  const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await db.package.create({
    data: {
      slug: `${slug}-${Date.now().toString(36)}`,
      nameAr,
      nameEn,
      hoursPerMonth: hours,
      priceMonthly: price,
      tier,
      categoryId: categoryId === "none" ? null : categoryId,
    },
  });
  revalidatePath("/admin/catalog");
}

export async function togglePackage(formData: FormData) {
  await requireUser(Role.ADMIN);
  const id = formData.get("id") as string;
  const pkg = await db.package.findUnique({ where: { id } });
  if (!pkg) return;
  await db.package.update({ where: { id }, data: { active: !pkg.active } });
  revalidatePath("/admin/catalog");
}

export async function updateContractTemplate(formData: FormData) {
  await requireUser(Role.ADMIN);
  const bodyAr = ((formData.get("bodyAr") as string) ?? "").trim();
  const bodyEn = ((formData.get("bodyEn") as string) ?? "").trim();
  if (!bodyAr || !bodyEn) return;
  const active = await db.contractTemplate.findFirst({ where: { active: true } });
  if (active) {
    await db.contractTemplate.update({ where: { id: active.id }, data: { bodyAr, bodyEn } });
  } else {
    await db.contractTemplate.create({ data: { name: "default", bodyAr, bodyEn } });
  }
  revalidatePath("/admin/contract");
}
