import { Hash } from "~/lib/hash";
import { userRepo } from "~/repos/user.repo";

export async function seedUsers() {
  console.log("\n\n📂 Seeding User...");

  const seedUsers = [
    { username: "admin1", role: "admin" },
    { username: "analyst1", role: "analyst" },
    { username: "viewer1", role: "viewer" },
  ] as const;

  const DEFAULT_PASSWORD = "password123";

  for (const user of seedUsers) {
    const existing = await userRepo.findByUsername(
      { id: "seed" } as any,
      user.username,
    );

    if (existing) {
      console.log(`⏭️ Skipping ${user.username} (already exists)`);
      continue;
    }

    const hashedPassword = await Hash.make(DEFAULT_PASSWORD);

    userRepo.create({ id: "seed" } as any, {
      username: user.username,
      role: user.role,
      hashedPassword,
    });

    console.log(`✅ Created ${user.role}: ${user.username}`);
  }

  console.log("🎉 User seeded\n");
}
