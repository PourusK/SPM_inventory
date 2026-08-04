"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteVessel } from "@/actions/vessels";

type Row = {
  id: number;
  imoNo: string;
  name: string;
  vesselType: string | null;
  builtYear: number | null;
  country: string | null;
  itemCount: number;
};

export function VesselTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete(id: number, name: string) {
    if (!confirm(`Delete vessel "${name}" and all its machinery records? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteVessel(id);
        toast.success("Vessel deleted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete vessel");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No vessels yet. Add one to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vessel</TableHead>
          <TableHead>IMO No</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Built</TableHead>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Machinery items</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              <Link href={`/vessels/${row.id}`} className="hover:underline">
                {row.name}
              </Link>
            </TableCell>
            <TableCell>{row.imoNo}</TableCell>
            <TableCell>{row.vesselType ?? "—"}</TableCell>
            <TableCell>{row.builtYear ?? "—"}</TableCell>
            <TableCell>{row.country ?? "—"}</TableCell>
            <TableCell className="text-right">{row.itemCount}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => onDelete(row.id, row.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
