import { recordRepo, RecordFilters, RecordType } from "~/repos/record.repo";
import { NotFoundError, BadRequestError } from "~/lib/errors";
import { categoryRepo } from "~/repos/category.repo";
import {
  CreateRecordInput,
  UpdateRecordInput,
} from "~/validators/record.validator";
import { RequestContext } from "~/types";
import { logger } from "~/lib/logger";

export const recordService = {
  async create(ctx: RequestContext, input: CreateRecordInput) {
    logger.info(ctx,`[${ctx.id}] record.create.service`);

    if (input.amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    const category = await categoryRepo.ensure(ctx, input.category, input.type);

    return recordRepo.create(ctx, {
      ...input,
      categoryId: category.id,
      amount: input.amount.toFixed(2),
    });
  },

  async getById(ctx: RequestContext, id: string) {
    logger.info(ctx,`[${ctx.id}] record.getById.service`);

    const record = await recordRepo.findById(ctx, id);
    if (!record) throw new NotFoundError("Record");

    return record;
  },

  async getAll(ctx: RequestContext, filters?: RecordFilters) {
    logger.info(ctx,`[${ctx.id}] record.getAll.service`);

    return recordRepo.findAll(ctx, filters);
  },

  async update(ctx: RequestContext, id: string, input: UpdateRecordInput) {
    logger.info(ctx,`[${ctx.id}] record.update.service`);

    const existing = await recordRepo.findById(ctx, id);
    if (!existing) throw new NotFoundError("Record");

    let categoryId = existing.category.id;

    if (input.category) {
      categoryId = (await categoryRepo.ensure(ctx, input.category, input.type))
        .id;
    }

    if (input.amount !== undefined && input.amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    const updated = await recordRepo.update(ctx, id, {
      ...input,
      categoryId,
      amount: input.amount !== undefined ? input.amount.toFixed(2) : undefined,
    });

    if (!updated) throw new NotFoundError("Record");

    return updated;
  },

  async delete(ctx: RequestContext, id: string): Promise<void> {
    logger.info(ctx,`[${ctx.id}] record.delete.service`);

    const deleted = await recordRepo.delete(ctx, id);
    if (!deleted) throw new NotFoundError("Record");
  },
};
