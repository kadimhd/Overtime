"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

export async function toggleLocale(formData: FormData) {
  const store = await cookies();
  const next = formData.get("locale") === "en" ? "en" : "ar";
  store.set("locale", next, { maxAge: 365 * 24 * 3600, path: "/" });
  redirect((formData.get("path") as string) || "/");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
