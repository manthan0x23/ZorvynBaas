// src/repos/record.repo.ts
import { db } from "../lib/db";
import { financialRecords, categories } from "../db/schema/records";
import { eq, and, gte, lte, desc, isNull, sql } from "drizzle-orm";
import { categoryRepo } from "./category.repo";

export type RecordStatus = "pending" | "posted" | "cancelled";
export type RecordType = "income" | "expense" | "special";

type CreateRecordInput = {
  category: string;
  amount: string;
  notes?: string;
  occurredAt: Date;
  status?: RecordStatus;
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
};

const notDeleted = isNull(financialRecords.deletedAt);

export const recordRepo = {
  async create(input: CreateRecordInput) {
    const category = await categoryRepo.ensure(input.category);

    const [record] = await db
      .insert(financialRecords)
      .values({
        ...input,
        categoryId: category.id,
      })
      .returning();

    return record;
  },

  async findById(id: string) {
    const [record] = await db
      .select({
        id: financialRecords.id,
        amount: financialRecords.amount,
        notes: financialRecords.notes,
        occurredAt: financialRecords.occurredAt,
        status: financialRecords.status,
        createdAt: financialRecords.createdAt,
        updatedAt: financialRecords.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type,
        },
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(and(eq(financialRecords.id, id), notDeleted))
      .limit(1);

    return record ?? null;
  },

  async findAll(filters?: RecordFilters) {
    const conditions = [notDeleted];

    if (filters?.category) {
      const category = await categoryRepo.findByName(filters.category);
      if (category.id)
        conditions.push(eq(financialRecords.categoryId, category.id));
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

    return db
      .select({
        id: financialRecords.id,
        amount: financialRecords.amount,
        notes: financialRecords.notes,
        occurredAt: financialRecords.occurredAt,
        status: financialRecords.status,
        createdAt: financialRecords.createdAt,
        updatedAt: financialRecords.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          type: categories.type,
        },
      })
      .from(financialRecords)
      .innerJoin(categories, eq(financialRecords.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(financialRecords.occurredAt));
  },

  async update(id: string, input: UpdateRecordInput) {
    const [updated] = await db
      .update(financialRecords)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(financialRecords.id, id), notDeleted))
      .returning();

    return updated ?? null;
  },

  async delete(id: string) {
    const now = new Date();

    const [updated] = await db
      .update(financialRecords)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(financialRecords.id, id), notDeleted))
      .returning();

    return updated ?? null;
  },

  async sumByType(filters?: { from?: Date; to?: Date }) {
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

  async sumByCategory(filters?: { from?: Date; to?: Date }) {
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

  async recentActivity(limit: number = 10) {
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

  async monthlyTotals(year: number) {
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
};
