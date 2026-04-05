import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres, { Sql } from "postgres";
import path from "path";
import { config } from "dotenv";

config();

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error(
    "❌ DATABASE_URL is not defined. Please set it in your environment variables.",
  );
}

const migrationClient: Sql<any> = postgres(DB_URL, {
  max: 1,
});

export const db = drizzle(postgres(DB_URL));

export async function migrate_db() {
  try {
    console.log("Running migrations...");

    await migrate(drizzle(migrationClient), {
      migrationsFolder: path.join(__dirname, "migrations"),
    });

    await migrationClient.end();
  } catch (error) {
    throw new Error(`Migration failed: ${error}`);
  }
}
