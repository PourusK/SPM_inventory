import { notFound } from "next/navigation";
import { getVessel } from "@/actions/vessels";
import { listItemMatchesForVessel } from "@/actions/matches";
import { MatchesTable } from "@/components/matches-table";
import { RecomputeMatchesButton } from "@/components/recompute-matches-button";

export default async function RecycledVesselMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vesselId = Number(id);
  if (!Number.isFinite(vesselId)) notFound();

  const vessel = await getVessel(vesselId);
  if (!vessel || vessel.sourceType !== "recycled") notFound();

  const items = await listItemMatchesForVessel(vesselId);
  const matchedCount = items.filter((i) => i.candidates.length > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Matches for {vessel.name}</h1>
          <p className="text-sm text-muted-foreground">
            IMO {vessel.imoNo} · {matchedCount} of {items.length} items have a potential match
            against Main Fleet / Offshore inventory
          </p>
        </div>
        <RecomputeMatchesButton vesselId={vessel.id} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No machinery recorded for this vessel yet. Import its spec sheet first.
        </p>
      ) : (
        <MatchesTable items={items} />
      )}
    </div>
  );
}
