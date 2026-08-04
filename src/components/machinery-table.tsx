"use client";

import { Fragment, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteMachineryItem } from "@/actions/machinery";
import {
  MachineryItemFormDialog,
  type CategoryOption,
  type ExistingItem,
} from "@/components/machinery-item-form-dialog";

export type MachineryRow = ExistingItem & {
  categoryName: string;
  categorySlug: string;
  source: "upload" | "manual";
};

export function MachineryTable({
  vesselId,
  rows,
  categories,
}: {
  vesselId: number;
  rows: MachineryRow[];
  categories: CategoryOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete(id: number) {
    if (!confirm("Delete this machinery item?")) return;
    startTransition(async () => {
      try {
        await deleteMachineryItem(id);
        toast.success("Item deleted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete item");
      }
    });
  }

  const grouped = new Map<string, MachineryRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.categoryName) ?? [];
    list.push(row);
    grouped.set(row.categoryName, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Machinery</h2>
        <MachineryItemFormDialog
          vesselId={vesselId}
          categories={categories}
          trigger={
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add item
            </Button>
          }
        />
      </div>

      {rows.length === 0 && (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No machinery recorded yet. Add an item manually, or import from a file.
        </p>
      )}

      {rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Maker</TableHead>
              <TableHead>Model / Type</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Key specs</TableHead>
              <TableHead className="w-10" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...grouped.entries()].map(([categoryName, items]) => (
              <Fragment key={categoryName}>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="bg-muted/50 py-1.5 text-xs font-medium text-muted-foreground">
                    {categoryName}
                  </TableCell>
                </TableRow>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.maker ?? "—"}</TableCell>
                    <TableCell>{item.modelType ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.serialNo ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-1">
                        {item.needsReview && (
                          <Badge variant="destructive" className="gap-1">
                            <TriangleAlert className="h-3 w-3" /> Needs review
                          </Badge>
                        )}
                        {specSummary(item.specs)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <MachineryItemFormDialog
                        vesselId={vesselId}
                        categories={categories}
                        item={item}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function specSummary(specs: Record<string, string | number | null>) {
  const entries = Object.entries(specs).filter(([, v]) => v !== null && v !== "");
  if (entries.length === 0) return "—";
  return entries
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}
