import { z } from "zod";

const dateString = z.coerce.date();

export const DashboardFilterSchema = z
  .object({
    from: dateString.optional(),
    to: dateString.optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) return data.from <= data.to;
      return true;
    },
    { message: "'from' must be before 'to'", path: ["from"] },
  );

export const TrendsSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, "Year must be a 4-digit number")
    .transform(Number)
    .refine((y) => y >= 2000 && y <= new Date().getFullYear(), {
      message: "Year out of valid range",
    })
    .optional()
    .default(new Date().getFullYear()),
  period: z.enum(["monthly", "weekly"]).default("monthly"),
});

export const InsightsSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(20).default(5),
  })
  .refine(
    (data) => {
      if (data.from && data.to) return data.from <= data.to;
      return true;
    },
    { message: "'from' must be before 'to'", path: ["from"] },
  );

export type InsightsInput = z.infer<typeof InsightsSchema>;
export type DashboardFilterInput = z.infer<typeof DashboardFilterSchema>;
export type TrendsInput = z.infer<typeof TrendsSchema>;
