import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, categories } from "./schema";
import argon2 from "argon2";

const seedCategories = [
  { name: "Salary", type: "income" },
  { name: "Bonus", type: "income" },
  { name: "Interest Income", type: "income" },
  { name: "Dividend Income", type: "income" },
  { name: "Business Revenue", type: "income" },
  { name: "Capital Gains", type: "income" },

  { name: "Rent / Lease", type: "expense" },
  { name: "Utilities", type: "expense" },
  { name: "Groceries", type: "expense" },
  { name: "Transportation", type: "expense" },
  { name: "Fuel", type: "expense" },
  { name: "Insurance", type: "expense" },
  { name: "Healthcare", type: "expense" },
  { name: "Education", type: "expense" },
  { name: "Subscriptions", type: "expense" },
  { name: "Professional Fees", type: "expense" },
  { name: "Taxes", type: "expense" },
  { name: "Loan Repayment", type: "expense" },
  { name: "Maintenance", type: "expense" },
  { name: "Travel", type: "expense" },
  { name: "Entertainment", type: "expense" },

  { name: "Transfer", type: "special" },
  { name: "Adjustment", type: "special" },
  { name: "Reversal", type: "special" },
  { name: "Reimbursement", type: "special" },
] as const;

async function seedCategoriesFn() {
  console.log("📂 Seeding categories...");

  for (const cat of seedCategories) {
    const existing = await db.query.categories.findFirst({
      where: (c) => eq(c.name, cat.name),
    });

    if (existing) {
      console.log(`⏭️ Skipping ${cat.name}`);
      continue;
    }

    await db.insert(categories).values({
      name: cat.name,
      type: cat.type,
      isSystem: true,
    });

    console.log(`✅ Added category: ${cat.name}`);
  }

  console.log("🎉 Categories seeded");
}

async function seed() {
  console.log("🌱 Seeding database...");

  await seedCategoriesFn();

  const seedUsers = [
    { username: "admin", role: "admin" },
    { username: "analyst1", role: "analyst" },
    { username: "analyst2", role: "analyst" },
    { username: "viewer1", role: "viewer" },
    { username: "viewer2", role: "viewer" },
  ] as const;

  const DEFAULT_PASSWORD = "password123";

  for (const user of seedUsers) {
    const existing = await db.query.users.findFirst({
      where: (u) => eq(u.username, user.username),
    });

    if (existing) {
      console.log(`⏭️ Skipping ${user.username} (already exists)`);
      continue;
    }

    const hashedPassword = await argon2.hash(DEFAULT_PASSWORD);

    await db.insert(users).values({
      username: user.username,
      role: user.role,
      hashedPassword,
    });

    console.log(`✅ Created ${user.role}: ${user.username}`);
  }

  console.log("🎉 Seeding complete");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
