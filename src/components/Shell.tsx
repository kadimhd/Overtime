import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { Role } from "@/lib/enums";
import { toggleLocale, logout } from "@/app/actions/session";
import { Logo } from "./Logo";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm text-ivory/85 hover:text-gold hover:bg-navy-soft transition-colors"
    >
      {label}
    </Link>
  );
}

/** App chrome: navy header with role-appropriate navigation. */
export async function Shell({
  children,
  currentPath = "/",
}: {
  children: React.ReactNode;
  currentPath?: string;
}) {
  const locale = await getLocale();
  const d = t(locale);
  const user = await getCurrentUser();

  const links: { href: string; label: string }[] = [];
  if (user?.role === Role.CLIENT) {
    links.push(
      { href: "/dashboard", label: d.navDashboard },
      { href: "/tasks/new", label: d.navPostTask },
      { href: "/retainers", label: d.navRetainers },
      { href: "/wallet", label: d.navWallet },
      { href: "/reviews", label: d.navReviews },
    );
  } else if (user?.role === Role.PROVIDER) {
    links.push(
      { href: "/provider", label: d.navDashboard },
      { href: "/provider/browse", label: d.navBrowseTasks },
      { href: "/provider/tasks", label: d.navMyTasks },
      { href: "/provider/earnings", label: d.navEarnings },
      { href: "/provider/profile", label: d.navProfile },
    );
  } else if (user?.role === Role.ADMIN) {
    links.push(
      { href: "/admin", label: d.navAdmin },
      { href: "/admin/disputes", label: d.adminDisputes },
      { href: "/admin/reports", label: d.adminReports },
      { href: "/admin/catalog", label: d.adminCatalog },
      { href: "/admin/contract", label: d.adminContract },
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy text-ivory">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link href={user ? links[0]?.href ?? "/" : "/"}>
            <Logo light />
          </Link>
          <nav className="flex items-center gap-1 flex-wrap">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <form action={toggleLocale}>
              <input type="hidden" name="locale" value={locale === "ar" ? "en" : "ar"} />
              <input type="hidden" name="path" value={currentPath} />
              <button className="text-sm text-ivory/70 hover:text-gold px-2 py-1 cursor-pointer">
                {d.langSwitch}
              </button>
            </form>
            {user ? (
              <form action={logout}>
                <button className="text-sm border border-ivory/30 rounded-md px-3 py-1.5 hover:border-gold hover:text-gold cursor-pointer">
                  {d.logout}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-gold text-navy rounded-md px-4 py-1.5 hover:bg-gold-soft"
              >
                {d.login}
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="bg-gold/15 border-b border-gold/30 text-navy text-xs">
        <div className="max-w-6xl mx-auto px-4 py-1.5">{d.demoBanner}</div>
      </div>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
      <footer className="bg-navy text-ivory/60 text-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} Overtime — Doha, Qatar</span>
          <span>{d.tagline}</span>
        </div>
      </footer>
    </div>
  );
}
