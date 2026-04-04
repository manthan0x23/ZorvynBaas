import { Request } from "express";
import { RequestContext } from "~/types";

export const createContext = (req: Request): RequestContext => {
  return {
    id: req.id,
    startTime: req.startTime,
    user: req.user,
  };
};
