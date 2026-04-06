import { seedUsers } from "./users";
import { seedCategories } from "./categories";
import { seedRecords } from "./records";
import { closeDb } from "./db";

async function seed() {
  console.log("🌱 Seeding database...");

  await seedUsers();
  await seedCategories();
  await seedRecords();

  console.log("\n🎉 Seeding complete");
}

seed()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await closeDb();
    process.exit(1);
  });
