import { seedCategoriesFn } from "./categories";
import { seedRecordsFn } from "./records";
import { seedUsers } from "./users";

async function seed() {
  console.log("🌱 Seeding database...");

  await seedCategoriesFn();
  await seedUsers();
  await seedRecordsFn();

  console.log("🎉 Seeding complete");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
