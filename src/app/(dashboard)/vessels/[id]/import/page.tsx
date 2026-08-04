import { notFound } from "next/navigation";
import { getVessel } from "@/actions/vessels";
import { listCategories } from "@/actions/machinery";
import { ImportFlow } from "@/components/import-flow";

// Extraction (vision + large tool-use output) can run well past Vercel's
// default Server Action timeout on a real vessel spec sheet.
export const maxDuration = 60;

export default async function VesselImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vesselId = Number(id);
  if (!Number.isFinite(vesselId)) notFound();

  const vessel = await getVessel(vesselId);
  if (!vessel) notFound();

  const categories = await listCategories();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Import for {vessel.name}</h1>
        <p className="text-sm text-muted-foreground">IMO {vessel.imoNo}</p>
      </div>
      <ImportFlow vesselId={vessel.id} categories={categories} />
    </div>
  );
}
