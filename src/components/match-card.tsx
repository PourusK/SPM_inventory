"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setMatchStatus } from "@/actions/matches";
import type { listMatchesForRecycledVessel } from "@/actions/matches";

export type MatchRow = Awaited<ReturnType<typeof listMatchesForRecycledVessel>>[number];

const TIER_STYLE: Record<string, { label: string; className: string }> = {
  "1": { label: "Tier 1 — high confidence", className: "bg-green-600 text-white hover:bg-green-600" },
  "2": { label: "Tier 2 — medium confidence", className: "bg-amber-500 text-white hover:bg-amber-500" },
  "3": { label: "Tier 3 — worth a look", className: "bg-slate-400 text-white hover:bg-slate-400" },
};

const SOURCE_LABEL: Record<string, string> = {
  main_fleet: "Main Fleet",
  offshore: "Offshore",
};

export function MatchCard({ match, showRecycledVessel }: { match: MatchRow; showRecycledVessel?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tierStyle = TIER_STYLE[match.tier] ?? TIER_STYLE["3"];

  function act(status: "confirmed" | "rejected") {
    startTransition(async () => {
      try {
        await setMatchStatus(match.id, status);
        toast.success(status === "confirmed" ? "Match confirmed" : "Match rejected");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update match");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className={tierStyle.className}>{tierStyle.label}</Badge>
            <span className="text-sm text-muted-foreground">
              {Math.round(Number(match.confidenceScore) * 100)}% confidence · {match.categoryName}
            </span>
          </div>
          {match.status !== "pending" && (
            <Badge variant={match.status === "confirmed" ? "default" : "outline"}>
              {match.status}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ItemSummary
            title={showRecycledVessel ? "On recycled vessel" : "Recycled item"}
            vesselName={match.recycledVesselName}
            vesselImo={match.recycledVesselImo}
            vesselHref={`/vessels/${match.recycledVesselId}`}
            maker={match.recycledMaker}
            modelType={match.recycledModelType}
            specs={match.recycledSpecs}
          />
          <ItemSummary
            title={`Matches your ${SOURCE_LABEL[match.ownedVesselSourceType] ?? "owned"} item`}
            vesselName={match.ownedVesselName}
            vesselImo={match.ownedVesselImo}
            vesselHref={`/vessels/${match.ownedVesselId}`}
            maker={match.ownedMaker}
            modelType={match.ownedModelType}
            specs={match.ownedSpecs}
          />
        </div>

        <p className="text-sm text-muted-foreground">{match.reason}</p>

        {match.status === "pending" && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => act("confirmed")} disabled={isPending}>
              <Check className="mr-1 h-4 w-4" /> Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={() => act("rejected")} disabled={isPending}>
              <X className="mr-1 h-4 w-4" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ItemSummary({
  title,
  vesselName,
  vesselImo,
  vesselHref,
  maker,
  modelType,
  specs,
}: {
  title: string;
  vesselName: string;
  vesselImo: string;
  vesselHref: string;
  maker: string | null;
  modelType: string | null;
  specs: Record<string, string | number | null>;
}) {
  const specEntries = Object.entries(specs).filter(([, v]) => v !== null && v !== "");
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <Link href={vesselHref} className="font-medium hover:underline">
        {vesselName}
      </Link>
      <p className="text-xs text-muted-foreground">IMO {vesselImo}</p>
      <p className="mt-1 text-sm">
        {maker ?? "—"} {modelType ? `· ${modelType}` : ""}
      </p>
      {specEntries.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {specEntries.map(([k, v]) => `${k}: ${v}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
