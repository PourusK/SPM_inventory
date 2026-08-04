import Link from "next/link";
import { getDashboardSummary } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardHome() {
  const summary = await getDashboardSummary();

  const cards = [
    { href: "/fleet", label: "Main Fleet vessels", value: summary.mainFleet },
    { href: "/offshore", label: "Offshore vessels", value: summary.offshore },
    { href: "/recycled", label: "Recycled vessels", value: summary.recycled },
    { href: "/matches", label: "Matches to review", value: summary.pendingMatches },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Search any vessel by name or IMO above, or jump into a section below.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {c.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-semibold">{c.value}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
