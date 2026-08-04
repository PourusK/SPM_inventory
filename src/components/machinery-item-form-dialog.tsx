"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { createMachineryItem, updateMachineryItem } from "@/actions/machinery";
import type { CategoryFieldDef } from "@/lib/db/schema";

export type CategoryOption = {
  id: number;
  name: string;
  criticalFields: CategoryFieldDef[];
  referenceFields: CategoryFieldDef[];
};

export type ExistingItem = {
  id: number;
  categoryId: number;
  maker: string | null;
  modelType: string | null;
  serialNo: string | null;
  specs: Record<string, string | number | null>;
  rawText: string | null;
  needsReview: boolean;
};

export function MachineryItemFormDialog({
  vesselId,
  categories,
  item,
  trigger,
}: {
  vesselId: number;
  categories: CategoryOption[];
  item?: ExistingItem;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [categoryId, setCategoryId] = useState<number | undefined>(item?.categoryId ?? categories[0]?.id);
  const [maker, setMaker] = useState(item?.maker ?? "");
  const [modelType, setModelType] = useState(item?.modelType ?? "");
  const [serialNo, setSerialNo] = useState(item?.serialNo ?? "");
  const [rawText, setRawText] = useState(item?.rawText ?? "");
  const [specs, setSpecs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [k, v] of Object.entries(item?.specs ?? {})) {
      initial[k] = v == null ? "" : String(v);
    }
    return initial;
  });

  const category = categories.find((c) => c.id === categoryId);
  // serial_no has its own dedicated field below (it's a top-level column, not a spec) — skip it here.
  const fields = category
    ? [...category.criticalFields, ...category.referenceFields].filter((f) => f.key !== "serial_no")
    : [];

  function submit() {
    if (!categoryId) return;

    const cleanedSpecs: Record<string, string | number | null> = {};
    for (const field of fields) {
      const raw = specs[field.key];
      if (raw === undefined || raw === "") {
        cleanedSpecs[field.key] = null;
      } else if (field.type === "number") {
        const n = Number(raw);
        cleanedSpecs[field.key] = Number.isFinite(n) ? n : null;
      } else {
        cleanedSpecs[field.key] = raw;
      }
    }

    startTransition(async () => {
      try {
        if (item) {
          await updateMachineryItem(item.id, {
            categoryId,
            maker: maker || null,
            modelType: modelType || null,
            serialNo: serialNo || null,
            specs: cleanedSpecs,
            rawText: rawText || null,
            needsReview: false,
          });
          toast.success("Item updated");
        } else {
          await createMachineryItem(vesselId, {
            categoryId,
            maker: maker || null,
            modelType: modelType || null,
            serialNo: serialNo || null,
            specs: cleanedSpecs,
            rawText: rawText || null,
            needsReview: false,
          });
          toast.success("Item added");
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit machinery item" : "Add machinery item"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={categoryId ? String(categoryId) : undefined}
              onValueChange={(v) => v && setCategoryId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Maker</Label>
              <Input value={maker} onChange={(e) => setMaker(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Model / Type</Label>
              <Input value={modelType} onChange={(e) => setModelType(e.target.value)} />
            </div>
          </div>

          {fields.length > 0 && (
            <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label>
                    {field.label}
                    {field.unit ? ` (${field.unit})` : ""}
                  </Label>
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    value={specs[field.key] ?? ""}
                    onChange={(e) => setSpecs((s) => ({ ...s, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Serial No (reference only — not used for matching)</Label>
            <Input value={serialNo} onChange={(e) => setSerialNo(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Notes / raw text</Label>
            <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !categoryId}>
            {isPending ? "Saving..." : item ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
