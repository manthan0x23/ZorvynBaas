import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import { Hash } from "../lib/hash";
import { nanoid } from "nanoid";

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("DATABASE_URL is not set in .env.test");
}

export async function setup() {
  console.log("\n🧪 E2E setup: running migrations on test DB...");

  const migrationClient = postgres(DB_URL!, { max: 1 });

  await migrate(drizzle(migrationClient), {
    migrationsFolder: path.resolve(__dirname, "../db/migrations"),
  });

  await migrationClient.end();

  console.log("✅ Migrations done");

  const client = postgres(DB_URL!, { max: 1 });
  const db = drizzle(client);

  const hashedPassword = await Hash.make("password123");

  const users = [
    { username: "admin1", role: "admin" },
    { username: "analyst1", role: "analyst" },
    { username: "viewer1", role: "viewer" },
  ];

  for (const u of users) {
    await client`
      INSERT INTO users (id, username, hashed_password, role)
      VALUES (${nanoid(6)}, ${u.username}, ${hashedPassword}, ${u.role})
      ON CONFLICT (username) DO NOTHING
    `;
  }

  await client.end();

  console.log("✅ Test users seeded");
}

export async function teardown() {
  console.log("\n🧹 E2E teardown: wiping test DB tables...");

  const client = postgres(DB_URL!, { max: 1 });

  await client`TRUNCATE TABLE sessions, financial_records, categories, users RESTART IDENTITY CASCADE`;

  await client.end();

  console.log("✅ Test DB clean");
}
