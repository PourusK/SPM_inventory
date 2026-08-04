"use client";

import { useState } from "react";
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
import type { CategoryFieldDef } from "@/lib/db/schema";
import type { DraftItem } from "@/components/import-flow";

export type CategoryOption = {
  id: number;
  slug: string;
  name: string;
  criticalFields: CategoryFieldDef[];
  referenceFields: CategoryFieldDef[];
};

/** Same field-editing UX as MachineryItemFormDialog, but writes to local draft state
 * instead of calling a Server Function — nothing here touches the DB until "Confirm & Save". */
export function DraftItemDialog({
  categories,
  item,
  onSave,
  trigger,
}: {
  categories: CategoryOption[];
  item: DraftItem;
  onSave: (updated: DraftItem) => void;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [categorySlug, setCategorySlug] = useState(item.categorySlug);
  const [maker, setMaker] = useState(item.maker ?? "");
  const [modelType, setModelType] = useState(item.modelType ?? "");
  const [serialNo, setSerialNo] = useState(item.serialNo ?? "");
  const [rawText, setRawText] = useState(item.rawText ?? "");
  const [specs, setSpecs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [k, v] of Object.entries(item.specs ?? {})) {
      initial[k] = v == null ? "" : String(v);
    }
    return initial;
  });

  const category = categories.find((c) => c.slug === categorySlug);
  const fields = category
    ? [...category.criticalFields, ...category.referenceFields].filter((f) => f.key !== "serial_no")
    : [];

  function submit() {
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

    onSave({
      ...item,
      categorySlug,
      maker: maker || null,
      modelType: modelType || null,
      serialNo: serialNo || null,
      specs: cleanedSpecs,
      rawText: rawText || null,
      needsReview: false,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit draft item</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={categorySlug} onValueChange={(v) => v && setCategorySlug(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
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
            <Label>Serial No (reference only)</Label>
            <Input value={serialNo} onChange={(e) => setSerialNo(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Raw source text</Label>
            <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
