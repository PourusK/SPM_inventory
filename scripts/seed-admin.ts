import { config } from "dotenv";

config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? "Admin";

  if (!email || !password) {
    console.error("Usage: npm run seed:admin -- <email> <password> [name]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db.select().from(users).where(eq(users.email, email));

  if (existing.length > 0) {
    await db.update(users).set({ passwordHash, name }).where(eq(users.email, email));
    console.log(`Updated password for existing user ${email}`);
  } else {
    await db.insert(users).values({ email, passwordHash, name });
    console.log(`Created user ${email}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
