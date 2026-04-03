// src/lib/permissions.ts
import { ForbiddenError } from "./errors";

export type UserRole = "viewer" | "analyst" | "admin";
export type Permission =
  | "record:read"
  | "record:create"
  | "record:update"
  | "record:delete"
  | "user:read"
  | "user:create"
  | "user:update"
  | "user:delete"
  | "dashboard:read"
  | "dashboard:insights"
  | "category:read"
  | "category:manage";

// role → what it can do
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: ["record:read", "dashboard:read", "category:read"],
  analyst: [
    "record:read",
    "record:create",
    "record:update",
    "dashboard:read",
    "dashboard:insights",
    "category:read",
  ],
  admin: [
    "record:read",
    "record:create",
    "record:update",
    "record:delete",
    "user:read",
    "user:create",
    "user:update",
    "user:delete",
    "dashboard:read",
    "dashboard:insights",
    "category:read",
    "category:manage",
  ],
};

export const PERMISSION_ROLES: Record<Permission, UserRole[]> = (() => {
  const map = {} as Record<Permission, UserRole[]>;

  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS) as [
    UserRole,
    Permission[],
  ][]) {
    for (const perm of perms) {
      if (!map[perm]) map[perm] = [];
      map[perm].push(role);
    }
  }

  return map;
})();

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) throw new ForbiddenError(permission);
}

// useful for queries: "fetch only records this role can see"
export function rolesWithPermission(permission: Permission): UserRole[] {
  return PERMISSION_ROLES[permission];
}
