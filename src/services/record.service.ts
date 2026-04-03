import { recordRepo, RecordFilters, RecordType } from "../repos/record.repo";
import { NotFoundError, BadRequestError } from "../lib/errors";
import { categoryRepo } from "~/repos/category.repo";

type CreateRecordInput = {
  category: string;
  amount: number;
  notes?: string;
  occurredAt: Date;
  status?: "pending" | "posted" | "cancelled";
};

type UpdateRecordInput = Partial<CreateRecordInput>;

export const recordService = {
  async create(input: CreateRecordInput) {
    if (input.amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    return recordRepo.create({
      ...input,
      category: input.category,
      amount: input.amount.toFixed(2),
    });
  },

  async getById(id: string) {
    const record = await recordRepo.findById(id);
    if (!record) throw new NotFoundError("Record");

    return record;
  },

  async getAll(filters?: RecordFilters) {
    return recordRepo.findAll(filters);
  },

  async update(id: string, input: UpdateRecordInput) {
    const existing = await recordRepo.findById(id);
    if (!existing) throw new NotFoundError("Record");

    let categoryId = existing.category.id;

    if (input.category) {
      categoryId = (await categoryRepo.ensure(input.category)).id;
    }

    if (input.amount !== undefined && input.amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    const updated = await recordRepo.update(id, {
      ...input,
      categoryId,
      amount: input.amount !== undefined ? input.amount.toFixed(2) : undefined,
    });

    if (!updated) throw new NotFoundError("Record");

    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await recordRepo.delete(id);
    if (!deleted) throw new NotFoundError("Record");
  },

  async getDashboardSummary(filters?: { from?: Date; to?: Date }) {
    const [byType, byCategory, recent] = await Promise.all([
      recordRepo.sumByType(filters),
      recordRepo.sumByCategory(filters),
      recordRepo.recentActivity(10),
    ]);

    const totals: Record<RecordType, number> = {
      income: 0,
      expense: 0,
      special: 0,
    };

    for (const row of byType) {
      totals[row.type as RecordType] = parseFloat(row.total ?? "0");
    }

    const netBalance = totals.income - totals.expense;

    const categoryTotals = byCategory.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      type: row.type,
      total: parseFloat(row.total ?? "0"),
    }));

    return {
      totalIncome: totals.income,
      totalExpenses: totals.expense,
      netBalance,
      categoryTotals,
      recentActivity: recent,
    };
  },

  async getMonthlyTrends(year: number) {
    const raw = await recordRepo.monthlyTotals(year);

    const monthMap = new Map<
      number,
      { income: number; expense: number; special: number }
    >();

    for (const row of raw) {
      const m = row.month;
      if (!monthMap.has(m)) {
        monthMap.set(m, { income: 0, expense: 0, special: 0 });
      }

      const entry = monthMap.get(m)!;
      entry[row.type as RecordType] = parseFloat(row.total ?? "0");
    }

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month,
        ...(monthMap.get(month) ?? { income: 0, expense: 0, special: 0 }),
      };
    });
  },
};
