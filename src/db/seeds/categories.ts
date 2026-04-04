import { categoryRepo } from "~/repos/category.repo";

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

export async function seedCategoriesFn() {
  console.log("📂 Seeding categories...");

  for (const cat of seedCategories) {
    await categoryRepo.ensure(cat.name, cat.type);

    console.log(`✅ Added category: ${cat.name}`);
  }

  console.log("🎉 Categories seeded");
}
