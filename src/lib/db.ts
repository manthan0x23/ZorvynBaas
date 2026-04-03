import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "~/db/schema";

const dbClient = postgres(env.DATABASE_URL as string, {
  max: 100,
  idle_timeout: 60,
  max_lifetime: 60 * 15,
});

const db = drizzle(dbClient, { schema });

export { db };
