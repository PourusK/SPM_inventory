"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setMatchStatus } from "@/actions/matches";
import type { VesselMatchItem, MatchCandidate } from "@/actions/matches";

const TIER_STYLE: Record<string, { label: string; className: string }> = {
  "1": { label: "Tier 1", className: "bg-green-600 text-white hover:bg-green-600" },
  "2": { label: "Tier 2", className: "bg-amber-500 text-white hover:bg-amber-500" },
  "3": { label: "Tier 3", className: "bg-slate-400 text-white hover:bg-slate-400" },
};

const SOURCE_LABEL: Record<string, string> = {
  main_fleet: "Main Fleet",
  offshore: "Offshore",
};

type TierFilter = "all" | "1" | "2" | "3" | "none";
type StatusFilter = "all" | "pending" | "confirmed" | "rejected";

export function MatchesTable({ items }: { items: VesselMatchItem[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [category, setCategory] = useState<string>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.categoryName))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (category !== "all" && item.categoryName !== category) return false;
      if (tier === "none" && item.candidates.length > 0) return false;
      if (tier !== "all" && tier !== "none" && item.bestTier !== tier) return false;
      if (status !== "all" && !item.candidates.some((c) => c.status === status)) return false;
      return true;
    });
  }, [items, category, tier, status]);

  const grouped = useMemo(() => {
    const map = new Map<string, VesselMatchItem[]>();
    for (const item of filtered) {
      const list = map.get(item.categoryName) ?? [];
      list.push(item);
      map.set(item.categoryName, list);
    }
    return map;
  }, [filtered]);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={(v) => v && setTier(v as TierFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            <SelectItem value="1">Tier 1</SelectItem>
            <SelectItem value="2">Tier 2</SelectItem>
            <SelectItem value="3">Tier 3</SelectItem>
            <SelectItem value="none">No match</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => v && setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <span className="flex items-center text-sm text-muted-foreground">
          {filtered.length} of {items.length} items
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No items match these filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Maker</TableHead>
              <TableHead>Model / Type</TableHead>
              <TableHead>Best match</TableHead>
              <TableHead className="text-right">Candidates</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...grouped.entries()].map(([categoryName, categoryItems]) => (
              <Fragment key={categoryName}>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="bg-muted/50 py-1.5 text-xs font-medium text-muted-foreground">
                    {categoryName}
                  </TableCell>
                </TableRow>
                {categoryItems.map((item) => {
                  const isOpen = expanded.has(item.id);
                  const tierStyle = item.bestTier ? TIER_STYLE[item.bestTier] : null;
                  return (
                    <Fragment key={item.id}>
                      <TableRow
                        className={item.candidates.length > 0 ? "cursor-pointer" : ""}
                        onClick={() => item.candidates.length > 0 && toggle(item.id)}
                      >
                        <TableCell>
                          {item.candidates.length > 0 &&
                            (isOpen ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ))}
                        </TableCell>
                        <TableCell className="font-medium">{item.maker ?? "—"}</TableCell>
                        <TableCell>{item.modelType ?? "—"}</TableCell>
                        <TableCell>
                          {tierStyle ? (
                            <Badge className={tierStyle.className}>{tierStyle.label}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">No match</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{item.candidates.length}</TableCell>
                        <TableCell>
                          <StatusSummary candidates={item.candidates} />
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-3">
                            <div className="flex flex-col gap-2">
                              {item.candidates.map((candidate) => (
                                <CandidateRow key={candidate.id} candidate={candidate} />
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function StatusSummary({ candidates }: { candidates: MatchCandidate[] }) {
  if (candidates.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  if (candidates.some((c) => c.status === "confirmed")) return <Badge>Confirmed</Badge>;
  if (candidates.every((c) => c.status === "rejected")) return <Badge variant="outline">Rejected</Badge>;
  return <Badge variant="secondary">Pending review</Badge>;
}

function CandidateRow({ candidate }: { candidate: MatchCandidate }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const tierStyle = TIER_STYLE[candidate.tier] ?? TIER_STYLE["3"];

  function act(status: "confirmed" | "rejected") {
    startTransition(async () => {
      try {
        await setMatchStatus(candidate.id, status);
        toast.success(status === "confirmed" ? "Match confirmed" : "Match rejected");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update match");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-background p-3 text-sm">
      <Badge className={tierStyle.className}>{tierStyle.label}</Badge>
      <span className="text-muted-foreground">
        {Math.round(Number(candidate.confidenceScore) * 100)}%
      </span>
      <Link href={`/vessels/${candidate.ownedVesselId}`} className="font-medium hover:underline">
        {candidate.ownedVesselName}
      </Link>
      <span className="text-muted-foreground">
        {SOURCE_LABEL[candidate.ownedVesselSourceType] ?? candidate.ownedVesselSourceType} · IMO{" "}
        {candidate.ownedVesselImo}
      </span>
      <span>
        {candidate.ownedMaker ?? "—"} {candidate.ownedModelType ? `· ${candidate.ownedModelType}` : ""}
      </span>
      <span className="flex-1 text-muted-foreground">{candidate.reason}</span>
      {candidate.status === "pending" ? (
        <div className="flex gap-1">
          <Button size="icon-sm" variant="outline" disabled={isPending} onClick={() => act("confirmed")}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="outline" disabled={isPending} onClick={() => act("rejected")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Badge variant={candidate.status === "confirmed" ? "default" : "outline"}>
          {candidate.status}
        </Badge>
      )}
    </div>
  );
}
