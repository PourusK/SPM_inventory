import { Plus } from "lucide-react";
import { listVessels } from "@/actions/vessels";
import { VesselTable } from "@/components/vessel-table";
import { VesselFormDialog } from "@/components/vessel-form-dialog";
import { Button } from "@/components/ui/button";

export default async function OffshorePage() {
  const vessels = await listVessels("offshore");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Offshore</h1>
          <p className="text-sm text-muted-foreground">
            Owned offshore vessels/assets and their machinery inventory.
          </p>
        </div>
        <VesselFormDialog
          sourceType="offshore"
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
