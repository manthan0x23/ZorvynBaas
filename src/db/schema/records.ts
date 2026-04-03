import { relations } from "drizzle-orm";
import {
  varchar,
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const recordTypeEnum = pgEnum("record_type_enum", [
  "income",
  "expense",
  "special",
]);

export const recordStatusEnum = pgEnum("record_status_enum", [
  "pending",
  "posted",
  "cancelled",
]);

export const categories = pgTable(
  "categories",
  {
    id: varchar("id", { length: 8 })
      .primaryKey()
      .$defaultFn(() => nanoid(8)),

    name: text("name").notNull().unique(),

    type: recordTypeEnum("type").notNull(),

    isSystem: boolean("is_system").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("cat_type_idx").on(t.type)],
);

export const financialRecords = pgTable(
  "financial_records",
  {
    id: varchar("id", { length: 10 })
      .primaryKey()
      .$defaultFn(() => nanoid(10)),

    categoryId: varchar("category_id", { length: 8 })
      .notNull()
      .references(() => categories.id),

    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

    notes: text("notes"),

    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    status: recordStatusEnum("status").notNull().default("posted"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("fr_category_idx").on(t.categoryId),
    index("fr_date_idx").on(t.occurredAt),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  records: many(financialRecords),
}));

export const financialRecordsRelations = relations(
  financialRecords,
  ({ one }) => ({
    category: one(categories, {
      fields: [financialRecords.categoryId],
      references: [categories.id],
    }),
  }),
);
