import { relations } from "drizzle-orm";
import {
  varchar,
  timestamp,
  pgEnum,
  pgTable,
  text,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const userRoleEnum = pgEnum("user_roles_enum", [
  "viewer",
  "analyst",
  "admin",
]);

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 6 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => nanoid(6)),

    username: text("username").notNull().unique(),

    hashedPassword: text("hashed_password").notNull(),

    role: userRoleEnum("role").default("viewer").notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date()),

    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: varchar("deleted_by"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("user_role_idx").on(table.role)],
);

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 8 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid(8)),

  userId: varchar("user_id", { length: 6 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
