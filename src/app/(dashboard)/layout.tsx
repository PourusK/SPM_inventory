import Link from "next/link";
import { NavSearch } from "@/components/nav-search";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/fleet", label: "Main Fleet" },
  { href: "/offshore", label: "Offshore" },
  { href: "/recycled", label: "Recycled" },
  { href: "/matches", label: "Matches" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="text-lg font-semibold whitespace-nowrap">Marine Spares Inventory</span>
          <nav className="flex flex-wrap gap-1">
            {NAV_LINKS.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                render={<Link href={link.href}>{link.label}</Link>}
              />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <NavSearch />
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
