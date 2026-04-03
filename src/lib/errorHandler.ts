import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../lib/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ValidationError) {
    return res.status(422).json({
      ok: false,
      code: err.code,
      message: err.message,
      fields: err.fields,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      code: err.code,
      message: err.message,
    });
  }

  console.error("[unhandled]", err);
  return res.status(500).json({
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
}
