import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "~/lib/errors";

type Source = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = req[source];

    const result = schema.safeParse(data);

    if (!result.success) {
      const fields: Record<string, string[]> = {};

      for (const issue of result.error.issues) {
        const path = issue.path.join(".") || "_root";
        if (!fields[path]) fields[path] = [];
        fields[path].push(issue.message);
      }

      return next(new ValidationError(fields));
    }

    req[source] = result.data;

    next();
  };
}
