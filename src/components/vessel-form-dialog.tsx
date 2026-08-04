"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { createVessel, updateVessel } from "@/actions/vessels";
import type { VesselInput } from "@/lib/validation";

type SourceType = VesselInput["sourceType"];

type ExistingVessel = {
  id: number;
  imoNo: string;
  name: string;
  exNames: string[];
  vesselType: string | null;
  builtYear: number | null;
  ldt: string | null;
  owner: string | null;
  plotNo: string | null;
  beachedDate: string | null;
  country: string | null;
};

export function VesselFormDialog({
  sourceType,
  vessel,
  trigger,
}: {
  sourceType: SourceType;
  vessel?: ExistingVessel;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [form, setForm] = useState({
    imoNo: vessel?.imoNo ?? "",
    name: vessel?.name ?? "",
    exNames: vessel?.exNames?.join(", ") ?? "",
    vesselType: vessel?.vesselType ?? "",
    builtYear: vessel?.builtYear?.toString() ?? "",
    ldt: vessel?.ldt ?? "",
    owner: vessel?.owner ?? "",
    plotNo: vessel?.plotNo ?? "",
    beachedDate: vessel?.beachedDate ?? "",
    country: vessel?.country ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    const input: VesselInput = {
      imoNo: form.imoNo,
      name: form.name,
      exNames: form.exNames
        ? form.exNames.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      sourceType,
      vesselType: form.vesselType || null,
      builtYear: form.builtYear ? Number(form.builtYear) : null,
      ldt: form.ldt ? Number(form.ldt) : null,
      owner: form.owner || null,
      plotNo: form.plotNo || null,
      beachedDate: form.beachedDate || null,
      country: form.country || null,
    };

    startTransition(async () => {
      try {
        if (vessel) {
          await updateVessel(vessel.id, input);
          toast.success("Vessel updated");
        } else {
          const created = await createVessel(input);
          toast.success("Vessel created");
          setOpen(false);
          if (created) {
            router.push(`/vessels/${created.id}`);
            return;
          }
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
          <DialogTitle>{vessel ? "Edit vessel" : "New vessel"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="IMO Number" required>
            <Input value={form.imoNo} onChange={(e) => set("imoNo", e.target.value)} />
          </Field>
          <Field label="Vessel Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Ex Names (comma separated)" span2>
            <Input value={form.exNames} onChange={(e) => set("exNames", e.target.value)} />
          </Field>
          <Field label="Vessel Type">
            <Input value={form.vesselType} onChange={(e) => set("vesselType", e.target.value)} />
          </Field>
          <Field label="Built Year">
            <Input
              type="number"
              value={form.builtYear}
              onChange={(e) => set("builtYear", e.target.value)}
            />
          </Field>
          <Field label="LDT">
            <Input type="number" value={form.ldt} onChange={(e) => set("ldt", e.target.value)} />
          </Field>
          <Field label="Owner">
            <Input value={form.owner} onChange={(e) => set("owner", e.target.value)} />
          </Field>
          <Field label="Plot No / Yard">
            <Input value={form.plotNo} onChange={(e) => set("plotNo", e.target.value)} />
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
          </Field>
          {sourceType === "recycled" && (
            <Field label="Beached Date">
              <Input
                type="date"
                value={form.beachedDate ?? ""}
                onChange={(e) => set("beachedDate", e.target.value)}
              />
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || !form.imoNo || !form.name}>
            {isPending ? "Saving..." : vessel ? "Save changes" : "Create vessel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  span2,
  children,
}: {
  label: string;
  required?: boolean;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "col-span-2" : ""}`}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
