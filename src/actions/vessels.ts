"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { machineryItems, vessels } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { vesselInputSchema, type VesselInput, sourceTypeSchema } from "@/lib/validation";
import { z } from "zod";

export async function listVessels(sourceType: z.infer<typeof sourceTypeSchema>) {
  await requireSession();

  const rows = await db
    .select({
      id: vessels.id,
      imoNo: vessels.imoNo,
      name: vessels.name,
      vesselType: vessels.vesselType,
      builtYear: vessels.builtYear,
      country: vessels.country,
      itemCount: count(machineryItems.id),
    })
    .from(vessels)
    .leftJoin(machineryItems, eq(machineryItems.vesselId, vessels.id))
    .where(eq(vessels.sourceType, sourceType))
    .groupBy(vessels.id)
    .orderBy(asc(vessels.name));

  return rows;
}

export async function searchVessels(query: string) {
  await requireSession();
  if (!query.trim()) return [];

  return db
    .select({
      id: vessels.id,
      imoNo: vessels.imoNo,
      name: vessels.name,
      sourceType: vessels.sourceType,
    })
    .from(vessels)
    .where(or(ilike(vessels.name, `%${query}%`), ilike(vessels.imoNo, `%${query}%`)))
    .limit(20);
}

export async function getVessel(id: number) {
  await requireSession();
  const [vessel] = await db.select().from(vessels).where(eq(vessels.id, id));
  return vessel ?? null;
}

async function assertImoAvailable(imoNo: string, excludeId?: number) {
  const clause = excludeId
    ? and(eq(vessels.imoNo, imoNo), ne(vessels.id, excludeId))
    : eq(vessels.imoNo, imoNo);
  const [existing] = await db.select({ id: vessels.id }).from(vessels).where(clause);
  if (existing) {
    throw new Error(`IMO ${imoNo} is already registered to another vessel`);
  }
}

export async function createVessel(input: VesselInput) {
  await requireSession();
  const data = vesselInputSchema.parse(input);
  await assertImoAvailable(data.imoNo);

  const [created] = await db
    .insert(vessels)
    .values({
      imoNo: data.imoNo,
      name: data.name,
      exNames: data.exNames,
      sourceType: data.sourceType,
      vesselType: data.vesselType ?? null,
      builtYear: data.builtYear ?? null,
      ldt: data.ldt != null ? String(data.ldt) : null,
      owner: data.owner ?? null,
      plotNo: data.plotNo ?? null,
      beachedDate: data.beachedDate ?? null,
      country: data.country ?? null,
    })
    .returning();

  revalidatePath(`/${data.sourceType === "main_fleet" ? "fleet" : data.sourceType}`);
  return created;
}

export async function updateVessel(id: number, input: VesselInput) {
  await requireSession();
  const data = vesselInputSchema.parse(input);
  await assertImoAvailable(data.imoNo, id);

  const [updated] = await db
    .update(vessels)
    .set({
      imoNo: data.imoNo,
      name: data.name,
      exNames: data.exNames,
      sourceType: data.sourceType,
      vesselType: data.vesselType ?? null,
      builtYear: data.builtYear ?? null,
      ldt: data.ldt != null ? String(data.ldt) : null,
      owner: data.owner ?? null,
      plotNo: data.plotNo ?? null,
      beachedDate: data.beachedDate ?? null,
      country: data.country ?? null,
      updatedAt: new Date(),
    })
    .where(eq(vessels.id, id))
    .returning();

  revalidatePath(`/vessels/${id}`);
  return updated;
}

export async function deleteVessel(id: number) {
  await requireSession();
  const vessel = await getVessel(id);
  await db.delete(vessels).where(eq(vessels.id, id));
  if (vessel) {
    revalidatePath(`/${vessel.sourceType === "main_fleet" ? "fleet" : vessel.sourceType}`);
  }
}
