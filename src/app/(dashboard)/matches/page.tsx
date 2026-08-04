import { listAllPendingMatches } from "@/actions/matches";
import { MatchCard } from "@/components/match-card";

export default async function AllMatchesPage() {
  const matches = await listAllPendingMatches();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Matches to review</h1>
        <p className="text-sm text-muted-foreground">
          Pending spares matches across every recycled vessel, newest first by confidence.
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No pending matches. Import a recycled vessel&apos;s machinery list to generate some.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} showRecycledVessel />
          ))}
        </div>
      )}
    </div>
  );
}
