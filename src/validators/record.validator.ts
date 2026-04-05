import { z } from "zod";

export const CreateRecordSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  notes: z.string().max(500).optional(),
  occurredAt: z.coerce.date(),
  status: z.enum(["pending", "posted", "cancelled"]).default("posted"),
  type: z.enum(["income", "expense", "special"]).optional(),
});

export const UpdateRecordSchema = CreateRecordSchema.partial();

export const RecordFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(["income", "expense", "special"]).optional(),
  status: z.enum(["pending", "posted", "cancelled"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const RecordIdSchema = z.object({
  id: z.string().length(8, "Invalid record id"),
});

export const MonthlyTrendsSchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100)
    .default(new Date().getFullYear()),
});

export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;
export type RecordFilterInput = z.infer<typeof RecordFilterSchema>;
export type MonthlyTrendsInput = z.infer<typeof MonthlyTrendsSchema>;
