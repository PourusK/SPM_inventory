import { sql, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { machineryCategories, machineryItems, matches, vessels } from "@/lib/db/schema";
import type { CategoryFieldDef } from "@/lib/db/schema";

type CandidateRow = {
  owned_item_id: number;
  maker: string | null;
  model_type: string | null;
  specs: Record<string, string | number | null>;
  maker_sim: number;
  model_sim: number;
};

/**
 * Compares a recycled item's numeric critical fields against a candidate owned item's,
 * using each category's per-field tolerance. Returns the fraction of critical fields
 * that were comparable (both sides had a value) and within tolerance, plus which
 * field labels matched — this feeds the plain-language match reason.
 */
function scoreCriticalFields(
  criticalFields: CategoryFieldDef[],
  recycledSpecs: Record<string, string | number | null>,
  ownedSpecs: Record<string, string | number | null>
): { comparable: number; withinTolerance: number; matchedLabels: string[] } {
  let comparable = 0;
  let withinTolerance = 0;
  const matchedLabels: string[] = [];

  for (const field of criticalFields) {
    if (field.type !== "number") continue;
    const a = recycledSpecs[field.key];
    const b = ownedSpecs[field.key];
    if (a == null || b == null || a === "" || b === "") continue;
    const aNum = Number(a);
    const bNum = Number(b);
    if (!Number.isFinite(aNum) || !Number.isFinite(bNum)) continue;

    comparable += 1;
    const tolerancePct = field.tolerancePct ?? 15;
    const allowedDelta = Math.max(aNum, bNum) * (tolerancePct / 100);
    if (Math.abs(aNum - bNum) <= allowedDelta) {
      withinTolerance += 1;
      matchedLabels.push(field.label);
    }
  }

  return { comparable, withinTolerance, matchedLabels };
}

/**
 * Runs the tiered matching engine for one recycled vessel against all Main Fleet +
 * Offshore items in the same machinery category. Idempotent: clears prior matches
 * for this vessel's items before recomputing, so it's safe to re-run after edits.
 *
 * Tier 1 (high): maker + model/type text closely match (pg_trgm similarity).
 * Tier 2 (medium): maker plausibly matches AND category-critical numeric specs
 *   fall within that category's defined tolerance band.
 * Tier 3 (low): same category, weak text similarity only — worth a human look.
 *
 * serial_no/year/weight are never part of scoring (see lib/taxonomy.ts).
 */
export async function runMatchingForVessel(recycledVesselId: number): Promise<number> {
  const [vessel] = await db.select().from(vessels).where(eq(vessels.id, recycledVesselId));
  if (!vessel || vessel.sourceType !== "recycled") {
    throw new Error("runMatchingForVessel expects a recycled-vessel id");
  }

  const recycledItems = await db
    .select({
      id: machineryItems.id,
      categoryId: machineryItems.categoryId,
      maker: machineryItems.maker,
      modelType: machineryItems.modelType,
      specs: machineryItems.specs,
    })
    .from(machineryItems)
    .where(eq(machineryItems.vesselId, recycledVesselId));

  if (recycledItems.length === 0) {
    return 0;
  }

  // Clear prior matches for these items so re-running an import doesn't duplicate rows.
  await db.delete(matches).where(
    inArray(
      matches.recycledItemId,
      recycledItems.map((i) => i.id)
    )
  );

  const categories = await db.select().from(machineryCategories);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  let created = 0;

  for (const item of recycledItems) {
    const category = categoryById.get(item.categoryId);
    if (!category) continue;

    const result = await db.execute<CandidateRow>(sql`
      select
        oi.id as owned_item_id,
        oi.maker,
        oi.model_type,
        oi.specs,
        similarity(lower(coalesce(oi.maker, '')), lower(coalesce(${item.maker ?? ""}, ''))) as maker_sim,
        similarity(lower(coalesce(oi.model_type, '')), lower(coalesce(${item.modelType ?? ""}, ''))) as model_sim
      from machinery_items oi
      inner join vessels v on v.id = oi.vessel_id
      where oi.category_id = ${item.categoryId}
        and v.source_type in ('main_fleet', 'offshore')
      order by (
        similarity(lower(coalesce(oi.maker, '')), lower(coalesce(${item.maker ?? ""}, '')))
        + similarity(lower(coalesce(oi.model_type, '')), lower(coalesce(${item.modelType ?? ""}, '')))
      ) desc
      limit 25
    `);

    const candidates = (result as unknown as { rows: CandidateRow[] }).rows ?? [];
    const scored: Array<{ ownedItemId: number; tier: "1" | "2" | "3"; confidence: number; reason: string }> = [];

    for (const candidate of candidates) {
      const makerSim = Number(candidate.maker_sim) || 0;
      const modelSim = Number(candidate.model_sim) || 0;
      const fieldScore = scoreCriticalFields(category.criticalFields, item.specs, candidate.specs);

      let tier: "1" | "2" | "3" | null = null;
      let confidence = 0;
      const reasonParts: string[] = [];

      if (makerSim > 0.6 && modelSim > 0.7) {
        tier = "1";
        confidence = Math.min(0.99, 0.7 + 0.3 * ((makerSim + modelSim) / 2));
        reasonParts.push(`Same maker (${candidate.maker ?? "?"})`, `same model/type (${candidate.model_type ?? "?"})`);
        if (fieldScore.matchedLabels.length > 0) {
          reasonParts.push(`${fieldScore.matchedLabels.join(", ")} within range`);
        }
      } else if (
        makerSim > 0.4 &&
        fieldScore.comparable > 0 &&
        fieldScore.withinTolerance === fieldScore.comparable
      ) {
        tier = "2";
        confidence = Math.min(0.85, 0.4 + 0.4 * (fieldScore.withinTolerance / Math.max(1, category.criticalFields.length)));
        reasonParts.push(
          `Same maker (${candidate.maker ?? "?"})`,
          `${fieldScore.matchedLabels.join(", ")} within tolerance for ${category.name}`
        );
      } else if (makerSim > 0.2 || modelSim > 0.2) {
        tier = "3";
        confidence = 0.15 + 0.25 * Math.max(makerSim, modelSim);
        reasonParts.push(`Same category (${category.name})`, "weak text similarity — worth a manual check");
      }

      if (!tier) continue;
      scored.push({ ownedItemId: candidate.owned_item_id, tier, confidence, reason: reasonParts.join("; ") });
    }

    // Keep this item's results readable: best tier first, then confidence, capped at 5.
    scored.sort((a, b) => a.tier.localeCompare(b.tier) || b.confidence - a.confidence);
    for (const match of scored.slice(0, 5)) {
      await db.insert(matches).values({
        recycledItemId: item.id,
        ownedItemId: match.ownedItemId,
        tier: match.tier,
        confidenceScore: match.confidence.toFixed(2),
        reason: match.reason,
        status: "pending",
      });
      created += 1;
    }
  }

  return created;
}
