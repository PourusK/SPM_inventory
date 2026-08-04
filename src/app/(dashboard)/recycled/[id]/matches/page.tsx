import { notFound } from "next/navigation";
import { getVessel } from "@/actions/vessels";
import { listMatchesForRecycledVessel } from "@/actions/matches";
import { MatchCard } from "@/components/match-card";

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

  const matches = await listMatchesForRecycledVessel(vesselId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Matches for {vessel.name}</h1>
        <p className="text-sm text-muted-foreground">
          IMO {vessel.imoNo} · {matches.length} potential spares match
          {matches.length === 1 ? "" : "es"} against Main Fleet / Offshore inventory
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No matches yet. Import this vessel&apos;s machinery list first, or none of its items
          resembled anything in your Main Fleet / Offshore inventory.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
