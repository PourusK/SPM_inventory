"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { runImport, confirmImport } from "@/actions/imports";
import { DraftItemDialog, type CategoryOption } from "@/components/draft-item-dialog";

export type DraftItem = {
  tempId: string;
  categorySlug: string;
  maker: string | null;
  modelType: string | null;
  serialNo: string | null;
  specs: Record<string, string | number | null>;
  rawText: string | null;
  needsReview: boolean;
};

export function ImportFlow({
  vesselId,
  categories,
}: {
  vesselId: number;
  categories: CategoryOption[];
}) {
  const [isExtracting, startExtracting] = useTransition();
  const [isConfirming, startConfirming] = useTransition();
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  function onExtract() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    startExtracting(async () => {
      try {
        const result = await runImport(vesselId, formData);
        setUploadId(result.uploadId);
        setItems(
          result.items.map((item, i) => ({
            tempId: `${result.uploadId}-${i}`,
            categorySlug: item.categorySlug,
            maker: item.maker,
            modelType: item.modelType,
            serialNo: item.serialNo,
            specs: item.specs,
            rawText: item.rawText,
            needsReview: item.needsReview,
          }))
        );
        toast.success(`Extracted ${result.items.length} item(s) — review below before saving`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Extraction failed");
      }
    });
  }

  function updateItem(tempId: string, updated: DraftItem) {
    setItems((rows) => rows.map((r) => (r.tempId === tempId ? updated : r)));
  }

  function removeItem(tempId: string) {
    setItems((rows) => rows.filter((r) => r.tempId !== tempId));
  }

  function onConfirm() {
    if (!uploadId) return;
    startConfirming(async () => {
      try {
        const result = await confirmImport(
          vesselId,
          uploadId,
          items.map((item) => ({
            categorySlug: item.categorySlug,
            maker: item.maker,
            modelType: item.modelType,
            serialNo: item.serialNo,
            specs: item.specs,
            rawText: item.rawText,
            needsReview: item.needsReview,
          }))
        );
        toast.success(
          result.sourceType === "recycled"
            ? `Saved ${result.insertedCount} item(s), found ${result.matchCount} potential match(es)`
            : `Saved ${result.insertedCount} item(s)`
        );
        if (result.sourceType === "recycled") {
          router.push(`/recycled/${vesselId}/matches`);
        } else {
          router.push(`/vessels/${vesselId}`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save items");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <p className="text-sm text-muted-foreground">
            Upload a PDF, Excel sheet, or photographed drawing. It&apos;ll be read automatically
            and you&apos;ll get a chance to check and fix anything before it&apos;s saved.
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,image/*"
              className="text-sm"
            />
            <Button onClick={onExtract} disabled={isExtracting}>
              <Upload className="mr-1 h-4 w-4" />
              {isExtracting ? "Reading document..." : "Extract"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Review {items.length} item{items.length === 1 ? "" : "s"}
            </h2>
            <Button onClick={onConfirm} disabled={isConfirming}>
              {isConfirming ? "Saving..." : `Confirm & Save (${items.length})`}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Maker</TableHead>
                <TableHead>Model / Type</TableHead>
                <TableHead>Key specs</TableHead>
                <TableHead className="w-10" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.tempId}>
                  <TableCell>{categoryName(item.categorySlug)}</TableCell>
                  <TableCell className="font-medium">{item.maker ?? "—"}</TableCell>
                  <TableCell>{item.modelType ?? "—"}</TableCell>
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
                    <DraftItemDialog
                      categories={categories}
                      item={item}
                      onSave={(updated) => updateItem(item.tempId, updated)}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.tempId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
