import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(process.env.DATABASE_URL);
  // Required before the Drizzle migration runs: pg_trgm powers Tier 1 fuzzy
  // maker/model matching, vector powers the Tier 3 semantic similarity search.
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("Enabled pg_trgm and vector extensions.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
