import { recordRepo } from "~/repos/record.repo";
import { categoryRepo } from "~/repos/category.repo";

function randomDateLastYear() {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 365);

  return new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime()),
  );
}

function randomAmount(type: string) {
  if (type === "income") {
    return Math.floor(Math.random() * 50000) + 20000;
  }
  if (type === "expense") {
    return Math.floor(Math.random() * 5000) + 100;
  }
  return Math.floor(Math.random() * 10000);
}

export async function seedRecordsFn() {
  console.log("\n\n📊 Seeding records...");

  const allCategories = await categoryRepo.list();

  if (!allCategories.length) {
    console.error("Categories missing");
    return;
  }

  const TOTAL_RECORDS = 500;

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    const category =
      allCategories[Math.floor(Math.random() * allCategories.length)];

    await recordRepo.create({
      categoryId: category.id,
      amount: randomAmount(category.type).toString(),
      notes: `Seeded ${category.name}`,
      occurredAt: randomDateLastYear(),
      status: "posted",
      type: category.type,
    });
  }

  console.log(`✅ Inserted ${TOTAL_RECORDS} records`);
}
