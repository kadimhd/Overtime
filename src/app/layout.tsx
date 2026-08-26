import type { Metadata } from "next";
import "./globals.css";
import { dir, getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Overtime — الفريق اللي ما عندك",
  description:
    "Overtime connects Qatar's one-person companies with remote professionals — accounting, virtual assistance, and marketing, in Qatari Riyal.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)} className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
