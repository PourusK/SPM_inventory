import "dotenv/config";
import { db } from "@/lib/db";
import { machineryCategories } from "@/lib/db/schema";
import { MACHINERY_CATEGORIES } from "@/lib/taxonomy";

async function main() {
  for (const cat of MACHINERY_CATEGORIES) {
    await db
      .insert(machineryCategories)
      .values({
        name: cat.name,
        slug: cat.slug,
        criticalFields: cat.criticalFields,
        referenceFields: cat.referenceFields,
      })
      .onConflictDoUpdate({
        target: machineryCategories.slug,
        set: {
          name: cat.name,
          criticalFields: cat.criticalFields,
          referenceFields: cat.referenceFields,
        },
      });
  }
  const all = await db.select().from(machineryCategories);
  console.log(`Seeded taxonomy. machinery_categories now has ${all.length} rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
