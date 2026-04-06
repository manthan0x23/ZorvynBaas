import argon2 from "argon2";
import { db } from "./db";
import { users } from "../schema/users";

const SYSTEM_USER_ID = "system";
const DEFAULT_PASSWORD = "password123";

const SEED_USERS = [
  { username: "admin1", role: "admin" },
  { username: "analyst1", role: "analyst" },
  { username: "viewer1", role: "viewer" },
] as const;

export async function seedUsers() {
  console.log("\n👤 Seeding users...");

  const hashedSystem = await argon2.hash("system");

  await db
    .insert(users)
    .values({
      id: SYSTEM_USER_ID,
      username: "system",
      hashedPassword: hashedSystem,
      role: "admin",
    })
    .onConflictDoNothing({ target: users.id });

  console.log("✅ Ensured system user (id = 'system')");

  const hashedPassword = await argon2.hash(DEFAULT_PASSWORD);

  for (const user of SEED_USERS) {
    const inserted = await db
      .insert(users)
      .values({
        username: user.username,
        hashedPassword: hashedPassword,
        role: user.role,
      })
      .onConflictDoNothing({ target: users.username })
      .returning({ id: users.id });

    if (inserted.length === 0) {
      console.log(`⏭️  Skipping ${user.username} (already exists)`);
    } else {
      console.log(`✅ Created ${user.role}: ${user.username}`);
    }
  }

  console.log("🎉 Users seeded");
}
