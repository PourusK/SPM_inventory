"use server";

import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, vessels } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";

export async function getDashboardSummary() {
  await requireSession();

  const [fleetCount] = await db
    .select({ n: count() })
    .from(vessels)
    .where(eq(vessels.sourceType, "main_fleet"));
  const [offshoreCount] = await db
    .select({ n: count() })
    .from(vessels)
    .where(eq(vessels.sourceType, "offshore"));
  const [recycledCount] = await db
    .select({ n: count() })
    .from(vessels)
    .where(eq(vessels.sourceType, "recycled"));
  const [pendingMatches] = await db
    .select({ n: count() })
    .from(matches)
    .where(eq(matches.status, "pending"));

  return {
    mainFleet: fleetCount?.n ?? 0,
    offshore: offshoreCount?.n ?? 0,
    recycled: recycledCount?.n ?? 0,
    pendingMatches: pendingMatches?.n ?? 0,
  };
}
