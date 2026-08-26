"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OfferStatus, Role, TaskStatus } from "@/lib/enums";
import { holdTaskEscrow, releaseTaskEscrow } from "@/lib/payments/escrow";

export async function postTask(formData: FormData) {
  const user = await requireUser(Role.CLIENT);
  const categoryId = formData.get("categoryId") as string;
  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const budget = parseInt((formData.get("budget") as string) ?? "0", 10);
  const deadline = new Date((formData.get("deadline") as string) ?? "");
  if (!categoryId || !title || !budget || isNaN(deadline.getTime())) {
    redirect("/tasks/new?error=1");
  }
  const task = await db.task.create({
    data: { clientId: user.id, categoryId, title, description, budget, deadline },
  });
  redirect(`/tasks/${task.id}`);
}

export async function submitOffer(formData: FormData) {
  const user = await requireUser(Role.PROVIDER);
  const taskId = formData.get("taskId") as string;
  const price = parseInt((formData.get("price") as string) ?? "0", 10);
  const days = parseInt((formData.get("days") as string) ?? "0", 10);
  const message = ((formData.get("message") as string) ?? "").trim();
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.status !== TaskStatus.OPEN || !price || !days) {
    redirect("/provider/browse");
  }
  await db.offer.upsert({
    where: { taskId_providerId: { taskId, providerId: user.id } },
    create: { taskId, providerId: user.id, price, days, message },
    update: { price, days, message, status: OfferStatus.PENDING },
  });
  redirect(`/provider/browse?sent=1`);
}

/**
 * Accepting an offer is the pivotal transaction (spec §5-ب steps 3–4):
 * escrow-hold the offer price at the licensed gateway, snapshot the active
 * contract template into an immutable Contract, reject sibling offers, and
 * move the task to IN_PROGRESS.
 */
export async function acceptOffer(formData: FormData) {
  const user = await requireUser(Role.CLIENT);
  const offerId = formData.get("offerId") as string;
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { task: true, provider: true },
  });
  if (!offer || offer.task.clientId !== user.id || offer.task.status !== TaskStatus.OPEN) {
    redirect("/dashboard");
  }

  const payment = await holdTaskEscrow({
    clientId: user.id,
    taskId: offer.taskId,
    amount: offer.price,
  });
  if (payment.status === "FAILED") redirect(`/tasks/${offer.taskId}?payerror=1`);

  const template = await db.contractTemplate.findFirst({ where: { active: true } });
  const render = (body: string) =>
    body
      .replaceAll("{{client}}", user.name)
      .replaceAll("{{provider}}", offer.provider.name)
      .replaceAll("{{task}}", offer.task.title)
      .replaceAll("{{price}}", String(offer.price))
      .replaceAll("{{days}}", String(offer.days))
      .replaceAll("{{date}}", new Date().toISOString().slice(0, 10));

  await db.$transaction([
    db.offer.update({ where: { id: offer.id }, data: { status: OfferStatus.ACCEPTED } }),
    db.offer.updateMany({
      where: { taskId: offer.taskId, id: { not: offer.id }, status: OfferStatus.PENDING },
      data: { status: OfferStatus.REJECTED },
    }),
    db.task.update({
      where: { id: offer.taskId },
      data: { status: TaskStatus.IN_PROGRESS },
    }),
    db.contract.create({
      data: {
        taskId: offer.taskId,
        offerId: offer.id,
        templateId: template?.id ?? "none",
        body: template
          ? `${render(template.bodyAr)}\n\n---\n\n${render(template.bodyEn)}`
          : "",
      },
    }),
  ]);
  redirect(`/tasks/${offer.taskId}`);
}

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const taskId = formData.get("taskId") as string;
  const body = ((formData.get("body") as string) ?? "").trim();
  const kind = formData.get("kind") === "ATTACHMENT" ? "ATTACHMENT" : "TEXT";
  if (!body) return;
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { offers: { where: { status: OfferStatus.ACCEPTED } } },
  });
  if (!task) return;
  const isParty = task.clientId === user.id || task.offers.some((o) => o.providerId === user.id);
  if (!isParty) return;
  await db.message.create({ data: { taskId, senderId: user.id, body, kind } });
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/provider/tasks/${taskId}`);
}

export async function markDelivered(formData: FormData) {
  const user = await requireUser(Role.PROVIDER);
  const taskId = formData.get("taskId") as string;
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { offers: { where: { status: OfferStatus.ACCEPTED } } },
  });
  if (!task || task.status !== TaskStatus.IN_PROGRESS) return;
  if (!task.offers.some((o) => o.providerId === user.id)) return;
  await db.task.update({ where: { id: taskId }, data: { status: TaskStatus.DELIVERED } });
  await db.message.create({
    data: { taskId, senderId: user.id, body: "DELIVERED", kind: "STATUS" },
  });
  revalidatePath(`/provider/tasks/${taskId}`);
}

/** Client approves delivery → escrow released to provider (spec §5-ب step 6). */
export async function approveDelivery(formData: FormData) {
  const user = await requireUser(Role.CLIENT);
  const taskId = formData.get("taskId") as string;
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task || task.clientId !== user.id || task.status !== TaskStatus.DELIVERED) return;
  await releaseTaskEscrow(taskId);
  await db.task.update({
    where: { id: taskId },
    data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
  });
  await db.message.create({
    data: { taskId, senderId: user.id, body: "COMPLETED", kind: "STATUS" },
  });
  revalidatePath(`/tasks/${taskId}`);
}

export async function openDispute(formData: FormData) {
  const user = await requireUser();
  const taskId = formData.get("taskId") as string;
  const reason = ((formData.get("reason") as string) ?? "").trim();
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { offers: { where: { status: OfferStatus.ACCEPTED } }, dispute: true },
  });
  if (!task || task.dispute || !reason) return;
  const isParty = task.clientId === user.id || task.offers.some((o) => o.providerId === user.id);
  if (!isParty) return;
  if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.DELIVERED) return;
  await db.$transaction([
    db.dispute.create({ data: { taskId, openerId: user.id, reason } }),
    db.task.update({ where: { id: taskId }, data: { status: TaskStatus.DISPUTED } }),
  ]);
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/provider/tasks/${taskId}`);
}

export async function leaveReview(formData: FormData) {
  const user = await requireUser();
  const taskId = formData.get("taskId") as string;
  const rating = Math.min(5, Math.max(1, parseInt((formData.get("rating") as string) ?? "5", 10)));
  const comment = ((formData.get("comment") as string) ?? "").trim();
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { offers: { where: { status: OfferStatus.ACCEPTED } } },
  });
  if (!task || task.status !== TaskStatus.COMPLETED) return;
  const provider = task.offers[0]?.providerId;
  if (!provider) return;
  let revieweeId: string;
  if (user.id === task.clientId) revieweeId = provider;
  else if (user.id === provider) revieweeId = task.clientId;
  else return;
  await db.review.upsert({
    where: { taskId_reviewerId: { taskId, reviewerId: user.id } },
    create: { taskId, reviewerId: user.id, revieweeId, rating, comment },
    update: { rating, comment },
  });
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/provider/tasks/${taskId}`);
}
