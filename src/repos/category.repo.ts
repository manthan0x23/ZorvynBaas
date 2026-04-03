import { db } from "../lib/db";
import { categories } from "../db/schema/records";
import { eq } from "drizzle-orm";

export type CreateCategoryInput = {
  name: string;
  type: "income" | "expense" | "special";
  isSystem?: boolean;
};

export const categoryRepo = {
  async findById(id: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return category ?? null;
  },

  async findByName(name: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);

    return category ?? null;
  },

  async create(input: CreateCategoryInput) {
    const [category] = await db
      .insert(categories)
      .values({
        ...input,
        type: input.type,
        isSystem: input.isSystem ?? false,
      })
      .returning();

    return category;
  },

  async ensure(name: string) {
    const existing = await this.findByName(name);

    if (existing) return existing;

    return this.create({
      name,
      type: "special",
    });
  },
};
