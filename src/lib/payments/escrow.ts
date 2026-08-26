import { db } from "@/lib/db";
import { COMMISSION_RATE, PaymentKind, PaymentStatus } from "@/lib/enums";
import { getGateway } from "./gateway";

/** Hold the accepted offer amount in escrow at the licensed gateway. */
export async function holdTaskEscrow(opts: { clientId: string; taskId: string; amount: number }) {
  const gateway = getGateway();
  const result = await gateway.hold(opts.amount, { userId: opts.clientId, purpose: `task_${opts.taskId}` });
  return db.payment.create({
    data: {
      userId: opts.clientId,
      taskId: opts.taskId,
      amount: opts.amount,
      commission: Math.round(opts.amount * COMMISSION_RATE),
      kind: PaymentKind.TASK_ESCROW,
      status: result.ok ? PaymentStatus.HELD : PaymentStatus.FAILED,
      gateway: gateway.name,
      gatewayRef: result.ref,
    },
  });
}

/** Capture the held charge and mark it released to the provider. */
export async function releaseTaskEscrow(taskId: string) {
  const payment = await db.payment.findFirst({
    where: { taskId, kind: PaymentKind.TASK_ESCROW, status: PaymentStatus.HELD },
  });
  if (!payment) return null;
  await getGateway().release(payment.gatewayRef);
  return db.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.RELEASED, releasedAt: new Date() },
  });
}

/** Refund the held charge back to the client (dispute resolution). */
export async function refundTaskEscrow(taskId: string) {
  const payment = await db.payment.findFirst({
    where: { taskId, kind: PaymentKind.TASK_ESCROW, status: PaymentStatus.HELD },
  });
  if (!payment) return null;
  await getGateway().refund(payment.gatewayRef);
  return db.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.REFUNDED, releasedAt: new Date() },
  });
}

/** Charge the first month of a retainer subscription. */
export async function chargeSubscription(opts: {
  clientId: string;
  subscriptionId: string;
  packageId: string;
  amount: number;
}) {
  const gateway = getGateway();
  const result = await gateway.chargeSubscription(opts.amount, {
    userId: opts.clientId,
    packageId: opts.packageId,
  });
  return db.payment.create({
    data: {
      userId: opts.clientId,
      subscriptionId: opts.subscriptionId,
      amount: opts.amount,
      commission: opts.amount, // retainer fee is platform revenue; provider payout handled separately
      kind: PaymentKind.SUBSCRIPTION,
      status: result.ok ? PaymentStatus.RELEASED : PaymentStatus.FAILED,
      gateway: gateway.name,
      gatewayRef: result.ref,
    },
  });
}

/** Provider earnings: released task payments minus commission, minus withdrawals. */
export async function providerBalances(providerUserId: string) {
  const accepted = await db.offer.findMany({
    where: { providerId: providerUserId, status: "ACCEPTED" },
    select: { taskId: true, price: true },
  });
  const taskIds = accepted.map((offer) => offer.taskId);
  const payments = await db.payment.findMany({
    where: { taskId: { in: taskIds }, kind: PaymentKind.TASK_ESCROW },
  });
  let available = 0;
  let pending = 0;
  for (const payment of payments) {
    const net = payment.amount - payment.commission;
    if (payment.status === PaymentStatus.RELEASED) available += net;
    else if (payment.status === PaymentStatus.HELD) pending += net;
  }
  const withdrawals = await db.withdrawal.aggregate({
    where: { providerId: providerUserId },
    _sum: { amount: true },
  });
  available -= withdrawals._sum.amount ?? 0;
  return { available, pending };
}
