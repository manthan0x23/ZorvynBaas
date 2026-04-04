import { Request, Response } from "express";
import { asyncHandler } from "../lib/handler";
import { recordService } from "../services/record.service";
import { logger } from "~/lib/logger";
import { createContext } from "~/lib/ctx";

export const recordHandler = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] record.create.handler`);

    const record = await recordService.create(ctx, req.validated.body);

    res.status(201).json({ ok: true, data: record });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] record.getById.handler`);

    const id = req.validated.params.id as string;

    const record = await recordService.getById(ctx, id);

    res.json({ ok: true, data: record });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] record.getAll.handler`);

    const records = await recordService.getAll(ctx, req.validated.query);

    res.json({ ok: true, data: records });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] record.update.handler`);

    const id = req.validated.params.id as string;

    const record = await recordService.update(ctx, id, req.validated.body);

    res.json({ ok: true, data: record });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] record.delete.handler`);

    const id = req.validated.params.id as string;

    await recordService.delete(ctx, id);

    res.json({ ok: true });
  }),
};
