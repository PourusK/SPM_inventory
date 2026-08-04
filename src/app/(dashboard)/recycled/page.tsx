import { Plus } from "lucide-react";
import { listVessels } from "@/actions/vessels";
import { VesselTable } from "@/components/vessel-table";
import { VesselFormDialog } from "@/components/vessel-form-dialog";
import { Button } from "@/components/ui/button";

export default async function RecycledPage() {
  const vessels = await listVessels("recycled");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recycled Vessels</h1>
          <p className="text-sm text-muted-foreground">
            Vessels beached for recycling. Upload a yard spec sheet to extract its
            machinery and see spares matches against Main Fleet / Offshore.
          </p>
        </div>
        <VesselFormDialog
          sourceType="recycled"
          trigger={
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Add vessel
            </Button>
          }
        />
      </div>
      <VesselTable rows={vessels} />
    </div>
  );
}
