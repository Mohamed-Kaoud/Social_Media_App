import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";

export const authorization = (roles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Unauthenticated 🔴", 400);
    }
    if (!roles.includes(req.user.role!)) {
      throw new AppError("Unauthorized access 🔴", 400);
    }
    next();
  };
};
