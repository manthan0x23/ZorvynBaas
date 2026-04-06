import { db } from "./db";
import { categories } from "../schema/records";

const SEED_CATEGORIES = [
  // income
  { name: "Salary", type: "income" },
  { name: "Bonus", type: "income" },
  { name: "Interest Income", type: "income" },
  { name: "Dividend Income", type: "income" },
  { name: "Business Revenue", type: "income" },
  { name: "Capital Gains", type: "income" },

  // expense
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

  // special
  { name: "Transfer", type: "special" },
  { name: "Adjustment", type: "special" },
  { name: "Reversal", type: "special" },
  { name: "Reimbursement", type: "special" },
] as const;

export async function seedCategories() {
  console.log("\n📂 Seeding categories...");

  const inserted = await db
    .insert(categories)
    .values(
      SEED_CATEGORIES.map((cat) => ({
        name: cat.name,
        type: cat.type,
        isSystem: true,
      })),
    )
    .onConflictDoNothing()
    .returning({ name: categories.name });

  console.log(
    `✅ Inserted ${inserted.length} new categories (${SEED_CATEGORIES.length - inserted.length} already existed)`,
  );
  console.log("🎉 Categories seeded");
}
