"use server";

import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { machineryCategories, machineryItems, matches, vessels } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";

const recycledItems = alias(machineryItems, "recycled_items");
const ownedItems = alias(machineryItems, "owned_items");
const recycledVessels = alias(vessels, "recycled_vessels");
const ownedVessels = alias(vessels, "owned_vessels");
const categoryAlias = alias(machineryCategories, "match_categories");

function baseMatchQuery() {
  return db
    .select({
      id: matches.id,
      tier: matches.tier,
      confidenceScore: matches.confidenceScore,
      reason: matches.reason,
      status: matches.status,
      createdAt: matches.createdAt,
      categoryName: categoryAlias.name,
      recycledItemId: recycledItems.id,
      recycledMaker: recycledItems.maker,
      recycledModelType: recycledItems.modelType,
      recycledSerialNo: recycledItems.serialNo,
      recycledSpecs: recycledItems.specs,
      recycledVesselId: recycledVessels.id,
      recycledVesselName: recycledVessels.name,
      recycledVesselImo: recycledVessels.imoNo,
      ownedItemId: ownedItems.id,
      ownedMaker: ownedItems.maker,
      ownedModelType: ownedItems.modelType,
      ownedSerialNo: ownedItems.serialNo,
      ownedSpecs: ownedItems.specs,
      ownedVesselId: ownedVessels.id,
      ownedVesselName: ownedVessels.name,
      ownedVesselImo: ownedVessels.imoNo,
      ownedVesselSourceType: ownedVessels.sourceType,
    })
    .from(matches)
    .innerJoin(recycledItems, eq(matches.recycledItemId, recycledItems.id))
    .innerJoin(ownedItems, eq(matches.ownedItemId, ownedItems.id))
    .innerJoin(categoryAlias, eq(recycledItems.categoryId, categoryAlias.id))
    .innerJoin(recycledVessels, eq(recycledItems.vesselId, recycledVessels.id))
    .innerJoin(ownedVessels, eq(ownedItems.vesselId, ownedVessels.id));
}

export async function listMatchesForRecycledVessel(recycledVesselId: number) {
  await requireSession();
  return baseMatchQuery()
    .where(eq(recycledVessels.id, recycledVesselId))
    .orderBy(matches.tier, desc(matches.confidenceScore));
}

export async function listAllPendingMatches() {
  await requireSession();
  return baseMatchQuery()
    .where(eq(matches.status, "pending"))
    .orderBy(matches.tier, desc(matches.confidenceScore))
    .limit(200);
}

export async function setMatchStatus(matchId: number, status: "confirmed" | "rejected") {
  const session = await requireSession();
  const [updated] = await db
    .update(matches)
    .set({ status, reviewedBy: Number(session.user.id), reviewedAt: new Date() })
    .where(eq(matches.id, matchId))
    .returning();

  if (updated) {
    const [row] = await db
      .select({ vesselId: machineryItems.vesselId })
      .from(machineryItems)
      .where(eq(machineryItems.id, updated.recycledItemId));
    if (row) revalidatePath(`/recycled/${row.vesselId}/matches`);
    revalidatePath("/matches");
  }
  return updated;
}
