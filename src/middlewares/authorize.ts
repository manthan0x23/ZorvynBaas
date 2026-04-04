import { NextFunction, Request, Response } from "express";
import { hasPermission, Permission } from "~/lib/permissions";
import { ForbiddenError } from "~/lib/errors";

export function authorize(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!hasPermission(req.user.role, permission)) {
      throw new ForbiddenError(permission);
    }

    next();
  };
}
