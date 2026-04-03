import { recordRepo, RecordFilters, RecordType } from "../repos/record.repo";
import { NotFoundError, BadRequestError } from "../lib/errors";
import { categoryRepo } from "~/repos/category.repo";
import {
  CreateRecordInput,
  UpdateRecordInput,
} from "~/validators/record.validator";

export const recordService = {
  async create(input: CreateRecordInput) {
    if (input.amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    const category = await categoryRepo.ensure(input.category, input.type);

    return recordRepo.create({
      ...input,
      categoryId: category.id,
      amount: input.amount.toFixed(2),
    });
  },

  async getById(id: string) {
    const record = await recordRepo.findById(id);
    if (!record) throw new NotFoundError("Record");

    return record;
  },

  async getAll(filters?: RecordFilters) {
    return recordRepo.findAll(filters);
  },

  async update(id: string, input: UpdateRecordInput) {
    const existing = await recordRepo.findById(id);
    if (!existing) throw new NotFoundError("Record");

    let categoryId = existing.category.id;

    if (input.category) {
      categoryId = (await categoryRepo.ensure(input.category, input.type)).id;
    }

    if (input.amount !== undefined && input.amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    const updated = await recordRepo.update(id, {
      ...input,
      categoryId,
      amount: input.amount !== undefined ? input.amount.toFixed(2) : undefined,
    });

    if (!updated) throw new NotFoundError("Record");

    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await recordRepo.delete(id);
    if (!deleted) throw new NotFoundError("Record");
  },
};
