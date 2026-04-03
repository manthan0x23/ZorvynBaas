import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres, { Sql } from "postgres";
import path from "path";
import { env } from "../env";

const migrationClient: Sql<any> = postgres(env.DATABASE_URL, { max: 1 });

export const db = drizzle(postgres(env.DATABASE_URL));

export async function migrate_db() {
  try {
    console.log("DB URL ::::: ", env.DATABASE_URL);

    await migrate(drizzle(migrationClient), {
      migrationsFolder: path.join(__dirname, "migrations"),
    });
    await migrationClient.end();
  } catch (error) {
    throw new Error(`Migration failed: ${error}`);
  }
}

migrate_db()
  .then(() => {
    console.log("Migration completed successfully.");
  })
  .catch((error) => {
    console.error(error);
  });
