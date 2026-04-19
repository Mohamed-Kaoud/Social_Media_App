import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";
import { ACCESS_SECRET_KEY, PREFIX } from "../../config/config.service";
import { VerifyToken } from "../utils/token.service";
import UserRepository from "../../DB/repositories/user.repository";
import { Types } from "mongoose";
const userModel = new UserRepository();
export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new AppError("Authorization header is required 🔴", 400);
  }
  const parts = authorization.split(" ");
  if (parts.length !== 2) {
    throw new AppError("Invalid authorization header format ❎", 400);
  }
  const [prefix, token] = parts;
  if (prefix !== PREFIX) {
    throw new AppError("Invalid token prefix ❎", 400);
  }
  if (!token) {
    throw new AppError("Token is missing 🔴", 400);
  }

  let decoded;
  try {
    decoded = VerifyToken({ token, secret_key: ACCESS_SECRET_KEY });
  } catch {
    throw new AppError("Invalid or expired token ❎", 401);
  }

  const user = await userModel.findById(new Types.ObjectId(decoded.id));
  if (!user) {
    throw new AppError("User not found ❎", 404);
  }
  (req as any).user = user;

  next();
};
