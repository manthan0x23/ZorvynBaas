import { db } from "./db";
import { categories, financialRecords } from "../schema/records";

const SYSTEM_USER_ID = "system";
const TOTAL_RECORDS = 500;
const CHUNK_SIZE = 100;

function randomDateLastYear(): Date {
  const now = Date.now();
  const past = now - 365 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function randomAmount(type: string): string {
  if (type === "income")
    return (Math.floor(Math.random() * 50000) + 20000).toFixed(2);
  if (type === "expense")
    return (Math.floor(Math.random() * 5000) + 100).toFixed(2);
  return Math.floor(Math.random() * 10000).toFixed(2);
}

export async function seedRecords() {
  console.log("\n📊 Seeding financial records...");

  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
    })
    .from(categories);

  if (!allCategories.length) {
    throw new Error("No categories found — run seedCategories first");
  }

  const rows = Array.from({ length: TOTAL_RECORDS }, () => {
    const category =
      allCategories[Math.floor(Math.random() * allCategories.length)];
    return {
      categoryId: category.id,
      amount: randomAmount(category.type),
      notes: `Seeded record — ${category.name}`,
      occurredAt: randomDateLastYear(),
      status: "posted" as const,
      createdBy: SYSTEM_USER_ID,
    };
  });

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);

    await db.insert(financialRecords).values(chunk);

    console.log(
      `  ↳ Inserted records ${i + 1}–${Math.min(i + CHUNK_SIZE, TOTAL_RECORDS)}`,
    );
  }

  console.log(`✅ Inserted ${TOTAL_RECORDS} records`);
}
