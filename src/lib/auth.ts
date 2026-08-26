import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import type { Role } from "./enums";

const SESSION_COOKIE = "ot_session";
const SESSION_DAYS = 30;

// Demo OTP. Production swaps sendOtp() for an SMS/WhatsApp provider
// (spec §9: WhatsApp Business API matters in the Qatari market).
export const DEMO_OTP = "123456";

export function normalizeTarget(raw: string): string {
  const value = raw.trim();
  if (value.includes("@")) return value.toLowerCase();
  // Normalize Qatari phone numbers to +974XXXXXXXX
  const digits = value.replace(/[^\d]/g, "");
  return digits.startsWith("974") ? `+${digits}` : `+974${digits}`;
}

export function isEmail(target: string): boolean {
  return target.includes("@");
}

export async function issueOtp(target: string) {
  await db.otpCode.deleteMany({ where: { target } });
  await db.otpCode.create({
    data: {
      target,
      code: DEMO_OTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
}

export async function checkOtp(target: string, code: string): Promise<boolean> {
  const row = await db.otpCode.findFirst({
    where: { target, code, expiresAt: { gt: new Date() } },
  });
  if (!row) return false;
  await db.otpCode.deleteMany({ where: { target } });
  return true;
}

export async function createSession(userId: string) {
  const session = await db.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000),
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 3600,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) await db.session.deleteMany({ where: { id } });
  store.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = await db.session.findUnique({
    where: { id },
    include: { user: { include: { providerProfile: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect("/");
  return user;
}
