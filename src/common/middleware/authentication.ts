import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";
import {
  ACCESS_SECRET_KEY_ADMIN,
  ACCESS_SECRET_KEY_USER,
  ADMIN_PREFIX,
  USER_PREFIX,
} from "../../config/config.service";
import UserRepository from "../../DB/repositories/user.repository";
import { Types } from "mongoose";
import tokenService from "../service/token.service";
import redisService from "../service/redis.service";

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

  let ACCESS_SECRET_KEY = "";

  if (prefix == USER_PREFIX) {
    ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_USER;
  } else if (prefix == ADMIN_PREFIX) {
    ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_ADMIN;
  } else {
    throw new AppError("Invalid prefix ❎", 400);
  }

  if (!token) {
    throw new AppError("Token is missing 🔴", 400);
  }

  const decoded = tokenService.VerifyToken({
    token,
    secret_key: ACCESS_SECRET_KEY,
  });
  const user = await userModel.findById(new Types.ObjectId(decoded.id));
  if (!user) {
    throw new AppError("User not found ❎", 404);
  }

  const revokeToken = await redisService.get(
    redisService.revoked_key({ userId: decoded.id, jti: decoded.jti! }),
  );
  if (revokeToken) {
    throw new AppError("Token revoked 🔴", 400);
  }
  req.user = user;
  req.decoded = decoded;

  next();
};
