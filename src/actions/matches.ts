"use server";

import { count, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { machineryCategories, machineryItems, matches, vessels } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { runMatchingForVessel } from "@/lib/matching";

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

export type MatchCandidate = Awaited<ReturnType<typeof baseMatchQuery>>[number];

function sortCandidates(a: MatchCandidate, b: MatchCandidate) {
  return a.tier.localeCompare(b.tier) || Number(b.confidenceScore) - Number(a.confidenceScore);
}

/** One row per recycled machinery item, each carrying its ranked candidate matches — the shape the
 * expandable matches table renders, instead of a flat list where every match is a visual peer. */
export async function listItemMatchesForVessel(recycledVesselId: number) {
  await requireSession();

  const items = await db
    .select({
      id: machineryItems.id,
      categoryId: machineryItems.categoryId,
      categoryName: machineryCategories.name,
      maker: machineryItems.maker,
      modelType: machineryItems.modelType,
      serialNo: machineryItems.serialNo,
      specs: machineryItems.specs,
    })
    .from(machineryItems)
    .innerJoin(machineryCategories, eq(machineryItems.categoryId, machineryCategories.id))
    .where(eq(machineryItems.vesselId, recycledVesselId))
    .orderBy(machineryCategories.name, machineryItems.maker);

  const candidateRows = await baseMatchQuery().where(eq(recycledVessels.id, recycledVesselId));

  const byItem = new Map<number, MatchCandidate[]>();
  for (const row of candidateRows) {
    const list = byItem.get(row.recycledItemId) ?? [];
    list.push(row);
    byItem.set(row.recycledItemId, list);
  }

  return items.map((item) => {
    const candidates = (byItem.get(item.id) ?? []).sort(sortCandidates);
    return {
      ...item,
      candidates,
      bestTier: candidates[0]?.tier ?? null,
    };
  });
}

export type VesselMatchItem = Awaited<ReturnType<typeof listItemMatchesForVessel>>[number];

/** Per-recycled-vessel rollup — total items, how many matched, and a breakdown by each
 * item's BEST tier (not raw match-row counts, so a duplicate hit against two owned vessels
 * doesn't get double-counted). Sorted so the most immediately actionable vessel is first. */
export async function listRecycledVesselMatchSummaries() {
  await requireSession();

  const recycledVesselRows = await db
    .select({ id: vessels.id, name: vessels.name, imoNo: vessels.imoNo })
    .from(vessels)
    .where(eq(vessels.sourceType, "recycled"));

  const itemCounts = await db
    .select({ vesselId: machineryItems.vesselId, total: count() })
    .from(machineryItems)
    .innerJoin(vessels, eq(machineryItems.vesselId, vessels.id))
    .where(eq(vessels.sourceType, "recycled"))
    .groupBy(machineryItems.vesselId);
  const countByVessel = new Map(itemCounts.map((r) => [r.vesselId, r.total]));

  const matchRows = await db
    .select({ vesselId: recycledItems.vesselId, itemId: recycledItems.id, tier: matches.tier })
    .from(matches)
    .innerJoin(recycledItems, eq(matches.recycledItemId, recycledItems.id));

  const bestTierByItem = new Map<number, { vesselId: number; tier: string }>();
  for (const row of matchRows) {
    const existing = bestTierByItem.get(row.itemId);
    if (!existing || row.tier < existing.tier) {
      bestTierByItem.set(row.itemId, { vesselId: row.vesselId, tier: row.tier });
    }
  }

  const summaryByVessel = new Map<number, { matchedItems: number; tier1: number; tier2: number; tier3: number }>();
  for (const { vesselId, tier } of bestTierByItem.values()) {
    const s = summaryByVessel.get(vesselId) ?? { matchedItems: 0, tier1: 0, tier2: 0, tier3: 0 };
    s.matchedItems += 1;
    if (tier === "1") s.tier1 += 1;
    else if (tier === "2") s.tier2 += 1;
    else s.tier3 += 1;
    summaryByVessel.set(vesselId, s);
  }

  const result = recycledVesselRows.map((v) => {
    const s = summaryByVessel.get(v.id) ?? { matchedItems: 0, tier1: 0, tier2: 0, tier3: 0 };
    const totalItems = countByVessel.get(v.id) ?? 0;
    return {
      vesselId: v.id,
      vesselName: v.name,
      imoNo: v.imoNo,
      totalItems,
      matchedItems: s.matchedItems,
      unmatchedItems: totalItems - s.matchedItems,
      tier1Count: s.tier1,
      tier2Count: s.tier2,
      tier3Count: s.tier3,
    };
  });

  result.sort((a, b) => b.tier1Count - a.tier1Count || b.matchedItems - a.matchedItems);
  return result;
}

export type VesselMatchSummary = Awaited<ReturnType<typeof listRecycledVesselMatchSummaries>>[number];

export async function recomputeMatches(recycledVesselId: number) {
  await requireSession();
  const result = await runMatchingForVessel(recycledVesselId);
  revalidatePath(`/recycled/${recycledVesselId}/matches`);
  revalidatePath("/matches");
  revalidatePath("/recycled");
  return result;
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
