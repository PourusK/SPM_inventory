import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Upload } from "lucide-react";
import { getVessel } from "@/actions/vessels";
import { listCategories, listMachineryForVessel } from "@/actions/machinery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VesselFormDialog } from "@/components/vessel-form-dialog";
import { MachineryTable } from "@/components/machinery-table";

const SOURCE_LABEL: Record<string, string> = {
  main_fleet: "Main Fleet",
  offshore: "Offshore",
  recycled: "Recycled",
};

export default async function VesselDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vesselId = Number(id);
  if (!Number.isFinite(vesselId)) notFound();

  const vessel = await getVessel(vesselId);
  if (!vessel) notFound();

  const [categories, items] = await Promise.all([
    listCategories(),
    listMachineryForVessel(vesselId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{vessel.name}</h1>
                <Badge variant="secondary">{SOURCE_LABEL[vessel.sourceType]}</Badge>
              </div>
              {vessel.exNames.length > 0 && (
                <p className="text-sm text-muted-foreground">Ex: {vessel.exNames.join(", ")}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                render={
                  <Link href={`/vessels/${vessel.id}/import`}>
                    <Upload className="mr-1 h-4 w-4" /> Import from file
                  </Link>
                }
              />
              <VesselFormDialog
                sourceType={vessel.sourceType}
                vessel={vessel}
                trigger={
                  <Button variant="outline">
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                }
              />
              {vessel.sourceType === "recycled" && (
                <Button render={<Link href={`/recycled/${vessel.id}/matches`}>View Matches</Link>} />
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <Field label="IMO No" value={vessel.imoNo} />
            <Field label="Type" value={vessel.vesselType} />
            <Field label="Built" value={vessel.builtYear} />
            <Field label="LDT" value={vessel.ldt} />
            <Field label="Owner" value={vessel.owner} />
            <Field label="Plot / Yard" value={vessel.plotNo} />
            <Field label="Country" value={vessel.country} />
            {vessel.sourceType === "recycled" && (
              <Field label="Beached Date" value={vessel.beachedDate} />
            )}
          </dl>
        </CardContent>
      </Card>

      <MachineryTable vesselId={vessel.id} rows={items} categories={categories} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}
