import { recordRepo, RecordType } from "../repos/record.repo";
import { InsightsInput } from "~/validators/dashboard.validator";

type CategoryTotal = {
  categoryId: string;
  categoryName: string;
  type: string;
  total: number;
};

function resolvePeriod(filters?: Pick<InsightsInput, "from" | "to">) {
  const to = filters?.to ?? new Date();
  const from = filters?.from ?? new Date(new Date().setDate(to.getDate() - 30));
  return { from, to };
}

function derivePreviousPeriod(from: Date, to: Date) {
  const span = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - span),
    to: new Date(from.getTime() - 1),
  };
}

function parseRows(
  rows: {
    categoryId: string;
    categoryName: string;
    type: string;
    total: string;
  }[],
): CategoryTotal[] {
  return rows.map((r) => ({
    ...r,
    total: parseFloat(r.total ?? "0"),
  }));
}

export const dashboardService = {
  async getInsights(filters?: InsightsInput) {
    const limit = filters?.limit ?? 5;
    const { from, to } = resolvePeriod(filters);
    const prev = derivePreviousPeriod(from, to);

    const [currentRows, previousRows] = await Promise.all([
      recordRepo.sumByCategoryForPeriod(from, to),
      recordRepo.sumByCategoryForPeriod(prev.from, prev.to),
    ]);

    const current = parseRows(currentRows);
    const previous = parseRows(previousRows);

    return {
      period: { from, to },
      spendingPatterns: deriveSpendingPatterns(current, limit),
      savingsRate: deriveSavingsRate(current),
      topMovers: deriveTopMovers(current, previous, limit),
    };
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

    const categoryTotals = byCategory.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      type: row.type,
      total: parseFloat(row.total ?? "0"),
    }));

    return {
      totalIncome: totals.income,
      totalExpenses: totals.expense,
      totalSpecial: totals.special,
      netBalance: totals.income - totals.expense,
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
      const month = Number(row.month); // parse it explicitly
      if (!monthMap.has(month)) {
        monthMap.set(month, { income: 0, expense: 0, special: 0 });
      }
      const entry = monthMap.get(month)!;
      entry[row.type as RecordType] = parseFloat(row.total ?? "0");
    }

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const data = monthMap.get(month) ?? { income: 0, expense: 0, special: 0 };
      return {
        month,
        ...data,
        net: data.income - data.expense,
      };
    });
  },

  async getWeeklyTrends(year: number) {
    const raw = await recordRepo.weeklyTotals(year);
    const WEEKS_IN_YEAR = 53;

    const weekMap = new Map<
      number,
      { income: number; expense: number; special: number }
    >();

    for (const row of raw) {
      const week = Number(row.isoWeek);
      if (!weekMap.has(week)) {
        weekMap.set(week, { income: 0, expense: 0, special: 0 });
      }
      const entry = weekMap.get(week)!;
      entry[row.type as RecordType] = parseFloat(row.total ?? "0");
    }

    return Array.from({ length: WEEKS_IN_YEAR }, (_, i) => {
      const week = i + 1;
      const data = weekMap.get(week) ?? { income: 0, expense: 0, special: 0 };
      return { week, ...data, net: data.income - data.expense };
    });
  },
};

function deriveSpendingPatterns(current: CategoryTotal[], limit: number) {
  const expenses = current.filter((r) => r.type === "expense");
  const totalExpense = expenses.reduce((sum, r) => sum + r.total, 0);

  const top = [...expenses]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      total: r.total,
      sharePercent:
        totalExpense > 0
          ? parseFloat(((r.total / totalExpense) * 100).toFixed(2))
          : 0,
    }));

  return { totalExpense, topCategories: top };
}

function deriveSavingsRate(current: CategoryTotal[]) {
  const totals: Record<RecordType, number> = {
    income: 0,
    expense: 0,
    special: 0,
  };

  for (const row of current) {
    totals[row.type as RecordType] += row.total;
  }

  const net = totals.income - totals.expense;
  const savingsRate =
    totals.income > 0
      ? parseFloat(((net / totals.income) * 100).toFixed(2))
      : 0;

  return {
    totalIncome: totals.income,
    totalExpenses: totals.expense,
    net,
    savingsRate,
  };
}

function deriveTopMovers(
  current: CategoryTotal[],
  previous: CategoryTotal[],
  limit: number,
) {
  const prevMap = new Map(previous.map((r) => [r.categoryId, r.total]));

  const movers = current
    .map((r) => {
      const prev = prevMap.get(r.categoryId) ?? 0;
      const delta = r.total - prev;
      const deltaPercent =
        prev > 0 ? parseFloat(((delta / prev) * 100).toFixed(2)) : null;

      return {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        type: r.type,
        current: r.total,
        previous: prev,
        delta,
        deltaPercent,
      };
    })
    .filter((r) => r.delta !== 0);

  const increased = [...movers]
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);

  const decreased = [...movers]
    .filter((r) => r.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit);

  return { increased, decreased };
}
