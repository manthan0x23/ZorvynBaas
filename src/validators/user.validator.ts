import { z } from "zod";

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const UpdateRoleSchema = z.object({
  role: z.enum(["viewer", "analyst", "admin"]),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must differ from current",
    path: ["newPassword"],
  });

export const UserIdSchema = z.object({
  id: z.string().length(6, "Invalid user id"),
});

export const UserFilterSchema = z.object({
  role: z.enum(["viewer", "analyst", "admin"]).optional(),
  search: z.string().optional(),
});
