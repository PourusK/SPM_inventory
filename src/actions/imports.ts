"use server";

import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { machineryCategories, machineryItems, uploads, vessels } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { extractMachinery, type ExtractedItem } from "@/lib/extraction";
import { rematchAfterVesselChange, runMatchingForVessel } from "@/lib/matching";
import { CATEGORY_SLUGS } from "@/lib/taxonomy";

const MAX_IMPORT_SIZE = 4_000_000;

export async function runImport(vesselId: number, formData: FormData) {
  const session = await requireSession();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }
  if (file.size === 0) {
    throw new Error("File is empty");
  }
  if (file.size > MAX_IMPORT_SIZE) {
    throw new Error("File is too large. Upload a file smaller than 4 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const blob = await put(`imports/${vesselId}/${Date.now()}-${file.name}`, buffer, {
    access: "private",
    contentType: file.type || "application/octet-stream",
  });

  const [upload] = await db
    .insert(uploads)
    .values({
      vesselId,
      fileUrl: blob.url,
      fileName: file.name,
      fileType: file.type || "unknown",
      status: "processing",
      uploadedBy: Number(session.user.id),
    })
    .returning();

  try {
    const items = await extractMachinery(buffer, file.name, file.type);
    await db
      .update(uploads)
      .set({ status: "review", extractedCount: items.length })
      .where(eq(uploads.id, upload.id));
    return { uploadId: upload.id, items };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.update(uploads).set({ status: "failed", errorMessage: message }).where(eq(uploads.id, upload.id));
    throw new Error(`Extraction failed: ${message}`);
  }
}

const confirmItemSchema = z.object({
  categorySlug: z.enum(CATEGORY_SLUGS as [string, ...string[]]),
  maker: z.string().nullable(),
  modelType: z.string().nullable(),
  serialNo: z.string().nullable(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
  rawText: z.string().nullable(),
  needsReview: z.boolean(),
});

export async function confirmImport(
  vesselId: number,
  uploadId: number,
  items: ExtractedItem[]
) {
  const session = await requireSession();
  const parsedItems = z.array(confirmItemSchema).parse(items);

  const categories = await db.select().from(machineryCategories);
  const slugToId = new Map(categories.map((c) => [c.slug, c.id]));
  const fallbackId = slugToId.get("other");

  const rows = parsedItems.map((item) => ({
    vesselId,
    categoryId: slugToId.get(item.categorySlug) ?? fallbackId!,
    maker: item.maker,
    modelType: item.modelType,
    serialNo: item.serialNo,
    specs: item.specs,
    rawText: item.rawText,
    needsReview: item.needsReview,
    source: "upload" as const,
    uploadId,
    createdBy: Number(session.user.id),
    updatedBy: Number(session.user.id),
  }));

  if (rows.length > 0) {
    await db.insert(machineryItems).values(rows);
  }
  await db
    .update(uploads)
    .set({ status: "done", extractedCount: rows.length })
    .where(eq(uploads.id, uploadId));

  const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId));

  // Recycled imports get an immediate match count for the UI; owned-side imports
  // (main_fleet/offshore) instead recompute matches for every existing recycled
  // vessel, since new fleet/offshore spares can retroactively match them.
  let matchCount = 0;
  if (vessel?.sourceType === "recycled") {
    matchCount = await runMatchingForVessel(vesselId);
    revalidatePath(`/recycled/${vesselId}/matches`);
    revalidatePath("/matches");
  } else if (vessel) {
    await rematchAfterVesselChange(vesselId);
  }

  revalidatePath(`/vessels/${vesselId}`);
  if (vessel) {
    revalidatePath(`/${vessel.sourceType === "main_fleet" ? "fleet" : vessel.sourceType}`);
  }

  return { insertedCount: rows.length, matchCount, sourceType: vessel?.sourceType ?? null };
}
