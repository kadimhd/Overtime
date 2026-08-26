"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Role, SubscriptionStatus } from "@/lib/enums";
import { chargeSubscription } from "@/lib/payments/escrow";

/**
 * Retainer subscribe (spec §5-ج): charge month 1 through the gateway, create
 * the subscription, and auto-match a verified provider serving the package's
 * category (falling back to any provider in it).
 */
export async function subscribe(formData: FormData) {
  const user = await requireUser(Role.CLIENT);
  const packageId = formData.get("packageId") as string;
  const pkg = await db.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.active) redirect("/retainers");

  const existing = await db.subscription.findFirst({
    where: { clientId: user.id, status: SubscriptionStatus.ACTIVE },
  });
  if (existing) {
    await db.subscription.update({
      where: { id: existing.id },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });
  }

  const candidates = await db.providerProfile.findMany({
    where: pkg.categoryId ? { categories: { some: { categoryId: pkg.categoryId } } } : {},
    orderBy: { verified: "desc" },
    take: 1,
  });

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);
  const sub = await db.subscription.create({
    data: {
      clientId: user.id,
      packageId,
      providerId: candidates[0]?.userId ?? null,
      renewsAt,
    },
  });
  await chargeSubscription({
    clientId: user.id,
    subscriptionId: sub.id,
    packageId,
    amount: pkg.priceMonthly,
  });
  redirect("/retainers");
}

export async function cancelSubscription(formData: FormData) {
  const user = await requireUser(Role.CLIENT);
  const id = formData.get("subscriptionId") as string;
  const sub = await db.subscription.findUnique({ where: { id } });
  if (!sub || sub.clientId !== user.id) return;
  await db.subscription.update({
    where: { id },
    data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
  });
  revalidatePath("/retainers");
}
