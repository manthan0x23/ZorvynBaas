import { db } from "~/lib/db";
import { financialRecords, categories } from "~/db/schema/records";
import { eq, and, gte, lte, desc, isNull, sql } from "drizzle-orm";
import { categoryRepo } from "./category.repo";
import { logger } from "~/lib/logger";
import { RequestContext } from "~/types";
import { users } from "~/db/schema";

export type RecordStatus = "pending" | "posted" | "cancelled";
export type RecordType = "income" | "expense" | "special";

export type CreateRecordInput = {
  categoryId: string;
  amount: string;
  notes?: string;
  occurredAt: Date;
  status?: RecordStatus;
  type?: RecordType;
};

type UpdateRecordInput = Partial<{
  categoryId: string;
  amount: string;
  notes: string;
  occurredAt: Date;
  status: RecordStatus;
}>;

export type RecordFilters = {
  category?: string;
  type?: RecordType;
  status?: RecordStatus;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
  search?: string; // matches against notes, category name, or type
};

const notDeleted = isNull(financialRecords.deletedAt);

export const recordRepo = {
  async create(ctx: RequestContext, input: CreateRecordInput) {
    logger.info(ctx, `[${ctx.id}] recordRepo.create (repo)`);

    const [record] = await db
      .insert(financialRecords)
      .values({
        ...input,
        createdBy: ctx.user.username,
      })
      .returning();

    return record;
  },

  async findById(ctx: RequestContext, id: string) {
    logger.info(ctx, `[${ctx.id}] recordRepo.findById (repo)`);

    const [record] = await db
      .select({
        id: financialRecords.id,
        amount: financialRecords.amount,
        notes: financialRecords.notes,
        occurredAt: financialRecords.occurredAt,
        status: financialRecords.status,
        createdAt: financialRecords.createdAt,
        updatedAt: financialRecords.updatedAt,
        createdBy: {
          username: users.username,
          role: users.role,
        },

        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type,
        },
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .innerJoin(users, eq(financialRecords.createdBy, users.id))
      .where(and(eq(financialRecords.id, id), notDeleted))
      .limit(1);

    return record ?? null;
  },

  async findAll(ctx: RequestContext, filters?: RecordFilters) {
    logger.info(ctx, `[${ctx.id}] recordRepo.findAll (repo)`);

    const conditions = [notDeleted];

    if (filters?.category) {
      const category = await categoryRepo.findByName(ctx, filters.category);
      if (category?.id) {
        conditions.push(eq(financialRecords.categoryId, category.id));
      }
    }

    if (filters?.status) {
      conditions.push(eq(financialRecords.status, filters.status));
    }

    if (filters?.from) {
      conditions.push(gte(financialRecords.occurredAt, filters.from));
    }

    if (filters?.to) {
      conditions.push(lte(financialRecords.occurredAt, filters.to));
    }

    if (filters?.type) {
      conditions.push(eq(categories.type, filters.type));
    }

    if (filters?.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        sql`(
          ${financialRecords.notes} ilike ${term}
          or ${categories.name}::text ilike ${term}
          or ${categories.type}::text ilike ${term}
        )`,
      );
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    return db
      .select({
        id: financialRecords.id,
        amount: financialRecords.amount,
        notes: financialRecords.notes,
        occurredAt: financialRecords.occurredAt,
        status: financialRecords.status,
        createdAt: financialRecords.createdAt,
        updatedAt: financialRecords.updatedAt,
        createdBy: {
          username: users.username,
          role: users.role,
        },
        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type,
        },
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .innerJoin(users, eq(financialRecords.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(financialRecords.occurredAt))
      .limit(limit)
      .offset(offset);
  },

  async update(ctx: RequestContext, id: string, input: UpdateRecordInput) {
    logger.info(ctx, `[${ctx.id}] recordRepo.update (repo)`);

    const [updated] = await db
      .update(financialRecords)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(financialRecords.id, id), notDeleted))
      .returning();

    return updated ?? null;
  },

  async delete(ctx: RequestContext, id: string) {
    logger.info(ctx, `[${ctx.id}] recordRepo.uloggerpdate (repo)`);

    const now = new Date();

    const [updated] = await db
      .update(financialRecords)
      .set({ deletedAt: now, updatedAt: now, deletedBy: ctx.user.id })
      .where(and(eq(financialRecords.id, id), notDeleted))
      .returning();

    return updated ?? null;
  },

  async sumByType(ctx: RequestContext, filters?: { from?: Date; to?: Date }) {
    logger.info(ctx, `[${ctx.id}] recordRepo.sumByType (repo)`);

    const conditions = [notDeleted, eq(financialRecords.status, "posted")];

    if (filters?.from)
      conditions.push(gte(financialRecords.occurredAt, filters.from));
    if (filters?.to)
      conditions.push(lte(financialRecords.occurredAt, filters.to));

    return db
      .select({
        type: categories.type,
        total: sql<string>`sum(${financialRecords.amount})`,
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(categories.type);
  },

  async sumByCategory(
    ctx: RequestContext,
    filters?: { from?: Date; to?: Date },
  ) {
    logger.info(ctx, `[${ctx.id}] recordRepo.sumByCategory (repo)`);

    const conditions = [notDeleted, eq(financialRecords.status, "posted")];

    if (filters?.from)
      conditions.push(gte(financialRecords.occurredAt, filters.from));
    if (filters?.to)
      conditions.push(lte(financialRecords.occurredAt, filters.to));

    return db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        type: categories.type,
        total: sql<string>`sum(${financialRecords.amount})`,
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(categories.id, categories.name, categories.type);
  },

  async recentActivity(ctx: RequestContext, limit: number = 10) {
    logger.info(ctx, `[${ctx.id}] recordRepo.recentActivity (repo)`);

    return db
      .select({
        id: financialRecords.id,
        amount: financialRecords.amount,
        occurredAt: financialRecords.occurredAt,
        status: financialRecords.status,
        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type,
        },
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(notDeleted)
      .orderBy(desc(financialRecords.occurredAt))
      .limit(limit);
  },

  async monthlyTotals(ctx: RequestContext, year: number) {
    logger.info(ctx, `[${ctx.id}] recordRepo.monthlyTotals (repo)`);

    return db
      .select({
        month: sql<number>`extract(month from ${financialRecords.occurredAt})`,
        type: categories.type,
        total: sql<string>`sum(${financialRecords.amount})`,
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(
        and(
          notDeleted,
          eq(financialRecords.status, "posted"),
          sql`extract(year from ${financialRecords.occurredAt}) = ${year}`,
        ),
      )
      .groupBy(
        sql`extract(month from ${financialRecords.occurredAt})`,
        categories.type,
      )
      .orderBy(sql`extract(month from ${financialRecords.occurredAt})`);
  },

  async weeklyTotals(ctx: RequestContext, year: number) {
    logger.info(ctx, `[${ctx.id}] recordRepo.weeklyTotals (repo)`);

    return db
      .select({
        week: sql<number>`extract(isoyear from ${financialRecords.occurredAt})`,
        isoWeek: sql<number>`extract(week from ${financialRecords.occurredAt})`,
        type: categories.type,
        total: sql<string>`sum(${financialRecords.amount})`,
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(
        and(
          notDeleted,
          eq(financialRecords.status, "posted"),
          // use isoyear, not year
          sql`extract(isoyear from ${financialRecords.occurredAt}) = ${year}`,
        ),
      )
      .groupBy(
        sql`extract(isoyear from ${financialRecords.occurredAt})`,
        sql`extract(week from ${financialRecords.occurredAt})`,
        categories.type,
      )
      .orderBy(sql`extract(week from ${financialRecords.occurredAt})`);
  },

  async sumByCategoryForPeriod(ctx: RequestContext, from: Date, to: Date) {
    logger.info(ctx, `[${ctx.id}] recordRepo.sumByCategoryForPeriod (repo)`);

    return db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        type: categories.type,
        total: sql<string>`sum(${financialRecords.amount})`,
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(
        and(
          notDeleted,
          eq(financialRecords.status, "posted"),
          gte(financialRecords.occurredAt, from),
          lte(financialRecords.occurredAt, to),
        ),
      )
      .groupBy(categories.id, categories.name, categories.type);
  },
};
