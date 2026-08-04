"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { machineryCategories, machineryItems, vessels } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { machineryItemInputSchema, type MachineryItemInput } from "@/lib/validation";
import { rematchAfterVesselChange } from "@/lib/matching";

export async function listCategories() {
  await requireSession();
  return db.select().from(machineryCategories).orderBy(machineryCategories.name);
}

export async function listMachineryForVessel(vesselId: number) {
  await requireSession();
  return db
    .select({
      id: machineryItems.id,
      categoryId: machineryItems.categoryId,
      categoryName: machineryCategories.name,
      categorySlug: machineryCategories.slug,
      maker: machineryItems.maker,
      modelType: machineryItems.modelType,
      serialNo: machineryItems.serialNo,
      specs: machineryItems.specs,
      rawText: machineryItems.rawText,
      needsReview: machineryItems.needsReview,
      source: machineryItems.source,
      updatedAt: machineryItems.updatedAt,
    })
    .from(machineryItems)
    .innerJoin(machineryCategories, eq(machineryItems.categoryId, machineryCategories.id))
    .where(eq(machineryItems.vesselId, vesselId))
    .orderBy(machineryCategories.name, machineryItems.maker);
}

async function revalidateVessel(vesselId: number) {
  const [vessel] = await db.select({ sourceType: vessels.sourceType }).from(vessels).where(eq(vessels.id, vesselId));
  revalidatePath(`/vessels/${vesselId}`);
  if (vessel) {
    revalidatePath(`/${vessel.sourceType === "main_fleet" ? "fleet" : vessel.sourceType}`);
  }
}

export async function createMachineryItem(vesselId: number, input: MachineryItemInput) {
  const session = await requireSession();
  const data = machineryItemInputSchema.parse(input);

  const [created] = await db
    .insert(machineryItems)
    .values({
      vesselId,
      categoryId: data.categoryId,
      maker: data.maker ?? null,
      modelType: data.modelType ?? null,
      serialNo: data.serialNo ?? null,
      specs: data.specs,
      rawText: data.rawText ?? null,
      needsReview: data.needsReview,
      source: "manual",
      createdBy: Number(session.user.id),
      updatedBy: Number(session.user.id),
    })
    .returning();

  await rematchAfterVesselChange(vesselId);
  await revalidateVessel(vesselId);
  return created;
}

export async function updateMachineryItem(id: number, input: MachineryItemInput) {
  const session = await requireSession();
  const data = machineryItemInputSchema.parse(input);

  const [updated] = await db
    .update(machineryItems)
    .set({
      categoryId: data.categoryId,
      maker: data.maker ?? null,
      modelType: data.modelType ?? null,
      serialNo: data.serialNo ?? null,
      specs: data.specs,
      rawText: data.rawText ?? null,
      needsReview: data.needsReview,
      updatedBy: Number(session.user.id),
      updatedAt: new Date(),
    })
    .where(eq(machineryItems.id, id))
    .returning();

  if (updated) {
    await rematchAfterVesselChange(updated.vesselId);
    await revalidateVessel(updated.vesselId);
  }
  return updated;
}

export async function deleteMachineryItem(id: number) {
  await requireSession();
  const [item] = await db.select({ vesselId: machineryItems.vesselId }).from(machineryItems).where(eq(machineryItems.id, id));
  await db.delete(machineryItems).where(eq(machineryItems.id, id));
  if (item) await revalidateVessel(item.vesselId);
}
