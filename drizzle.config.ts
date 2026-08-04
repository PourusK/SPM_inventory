import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// DATABASE_URL is only required for `db:push`/`db:migrate`/`db:studio`, not `db:generate`
// (which just diffs the schema file against prior migration snapshots).
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
