"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recomputeMatches } from "@/actions/matches";

export function RecomputeMatchesButton({ vesselId }: { vesselId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      try {
        const count = await recomputeMatches(vesselId);
        toast.success(`Recomputed — ${count} match(es) found`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to recompute matches");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={isPending}>
      <RefreshCw className={`mr-1 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Recomputing..." : "Recompute Matches"}
    </Button>
  );
}
