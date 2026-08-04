import Link from "next/link";
import { listRecycledVesselMatchSummaries } from "@/actions/matches";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AllMatchesPage() {
  const summaries = await listRecycledVesselMatchSummaries();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Matches</h1>
        <p className="text-sm text-muted-foreground">
          Every recycled vessel, ranked by how many high-confidence spares matches it has
          against Main Fleet / Offshore inventory. Open a vessel to review item-by-item.
        </p>
      </div>

      {summaries.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No recycled vessels yet. Import one to generate matches.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vessel</TableHead>
              <TableHead>IMO No</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Matched</TableHead>
              <TableHead>Tier 1</TableHead>
              <TableHead>Tier 2</TableHead>
              <TableHead>Tier 3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((s) => (
              <TableRow key={s.vesselId}>
                <TableCell className="font-medium">
                  <Link href={`/recycled/${s.vesselId}/matches`} className="hover:underline">
                    {s.vesselName}
                  </Link>
                </TableCell>
                <TableCell>{s.imoNo}</TableCell>
                <TableCell className="text-right">{s.totalItems}</TableCell>
                <TableCell className="text-right">{s.matchedItems}</TableCell>
                <TableCell>
                  {s.tier1Count > 0 && (
                    <Badge className="bg-green-600 text-white hover:bg-green-600">
                      {s.tier1Count}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {s.tier2Count > 0 && (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                      {s.tier2Count}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {s.tier3Count > 0 && (
                    <Badge className="bg-slate-400 text-white hover:bg-slate-400">
                      {s.tier3Count}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
